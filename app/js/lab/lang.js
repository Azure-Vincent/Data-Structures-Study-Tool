// Pseudocode Lab language: lexer, parser, re-indenter and a line highlighter.
// Pure functions, no DOM. The grammar is documented in docs/PSEUDOCODE.md and
// in the in-app syntax reference (lab/reference.js).
//
// Statements end at a newline (or ';'). Blocks are closed with `end`
// (optionally `end if`, `end while`, `end for`, `end function`).

export class LabError extends Error {
  /**
   * kind: 'syntax' | 'runtime'
   * extra: { line, col, hint, tag }
   */
  constructor(kind, message, extra = {}) {
    super(message);
    this.kind = kind;
    this.line = extra.line ?? null;
    this.col = extra.col ?? null;
    this.hint = extra.hint || '';
    this.tag = extra.tag || null;
  }
}

// Reserved words (matched case-insensitively). `each`, `in`, `to`, `step` are
// only special inside a `for` header, so they stay usable as variable names.
export const KEYWORDS = new Set([
  'if', 'then', 'else', 'elif', 'elseif', 'end', 'endif', 'endwhile', 'endfor', 'endfunction',
  'while', 'do', 'for', 'repeat', 'until', 'function', 'return', 'break', 'continue',
  'print', 'delete', 'free', 'new', 'and', 'or', 'not', 'true', 'false', 'null', 'nil', 'mod', 'div',
]);

export const CONSTRUCTORS = ['Node', 'Queue', 'Stack', 'Set', 'Array', 'List'];
const TYPE_WORDS = new Set(['int', 'integer', 'char', 'float', 'double', 'bool', 'boolean', 'struct', 'node', 'void', 'string', 'var', 'let']);

const OPS = ['->', '==', '!=', '<>', '<=', '>=', ':=', '+=', '-=', '++', '--', '&&', '||', '<', '>', '=', '+', '-', '*', '/', '%', '(', ')', '[', ']', ',', '.', '!', ';', '{', '}'];
const UNICODE = { '←': '=', '≠': '!=', '≤': '<=', '≥': '>=', '→': '->' };

/** Tokens: {t:'num'|'str'|'name'|'kw'|'op'|'nl'|'eof', v, line, col} */
export function tokenize(src) {
  const toks = [];
  const lines = String(src).replace(/\r\n?/g, '\n').split('\n');
  lines.forEach((text, li) => {
    const line = li + 1;
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      const col = i + 1;
      if (ch === ' ' || ch === '\t') {
        i++;
        continue;
      }
      if (ch === '#' || (ch === '/' && text[i + 1] === '/')) break; // comment
      if (/[0-9]/.test(ch)) {
        const m = /^\d+(\.\d+)?/.exec(text.slice(i));
        toks.push({ t: 'num', v: Number(m[0]), line, col });
        i += m[0].length;
        if (/[A-Za-z_]/.test(text[i] || '')) throw new LabError('syntax', `“${m[0]}${text.slice(i).match(/^\w+/)[0]}” is not a valid number or name. Names must start with a letter.`, { line, col });
        continue;
      }
      if (/[A-Za-z_]/.test(ch)) {
        const m = /^[A-Za-z_]\w*/.exec(text.slice(i));
        const low = m[0].toLowerCase();
        if (m[0] === '__proto__') throw new LabError('syntax', '“__proto__” is reserved and can’t be used as a name.', { line, col });
        if (KEYWORDS.has(low)) toks.push({ t: 'kw', v: low, line, col, raw: m[0] });
        else toks.push({ t: 'name', v: m[0], line, col });
        i += m[0].length;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '“' || ch === '‘') {
        const close = ch === '“' ? '”' : ch === '‘' ? '’' : ch;
        let j = i + 1;
        let out = '';
        while (j < text.length && text[j] !== close) {
          if (text[j] === '\\' && j + 1 < text.length) {
            out += text[j + 1] === 'n' ? '\n' : text[j + 1];
            j += 2;
          } else out += text[j++];
        }
        if (j >= text.length) throw new LabError('syntax', 'This text is missing its closing quote.', { line, col, hint: `Close it with ${close} on the same line.` });
        toks.push({ t: 'str', v: out, line, col });
        i = j + 1;
        continue;
      }
      if (UNICODE[ch]) {
        toks.push({ t: 'op', v: UNICODE[ch], line, col });
        i++;
        continue;
      }
      const op = OPS.find((o) => text.startsWith(o, i));
      if (!op) throw new LabError('syntax', `Unexpected character “${ch}”.`, { line, col, hint: 'Only letters, digits, quotes and the operators listed in the syntax reference are allowed.' });
      if (op === '{' || op === '}') throw new LabError('syntax', `Braces “${op}” are not used in this pseudocode.`, { line, col, hint: 'Open a block with then/do at the end of the line and close it with end on its own line.' });
      if (op === ';') toks.push({ t: 'nl', v: ';', line, col });
      else toks.push({ t: 'op', v: op === '<>' ? '!=' : op === '&&' ? 'and' : op === '||' ? 'or' : op, line, col, raw: op });
      i += op.length;
    }
    toks.push({ t: 'nl', v: '\n', line, col: text.length + 1 });
  });
  toks.push({ t: 'eof', v: '', line: lines.length, col: 1 });
  return toks;
}

const BLOCK_NAMES = { if: 'if', while: 'while', for: 'for', foreach: 'for', function: 'function', repeat: 'repeat', do: 'do' };

class Parser {
  constructor(toks) {
    this.t = toks;
    this.i = 0;
    this.blocks = []; // open blocks: {kind, line}
    this.inFunction = 0;
    this.loopDepth = 0;
  }
  peek(k = 0) {
    return this.t[Math.min(this.i + k, this.t.length - 1)];
  }
  next() {
    return this.t[this.i++];
  }
  is(type, v) {
    const p = this.peek();
    return p.t === type && (v === undefined || p.v === v);
  }
  isOp(v) {
    return this.is('op', v);
  }
  isKw(v) {
    return this.is('kw', v);
  }
  err(msg, tok = this.peek(), hint) {
    throw new LabError('syntax', msg, { line: tok.line, col: tok.col, hint });
  }
  desc(tok) {
    if (tok.t === 'eof') return 'the end of the program';
    if (tok.t === 'nl') return 'the end of the line';
    if (tok.t === 'str') return `"${tok.v}"`;
    return `“${tok.raw || tok.v}”`;
  }
  expectOp(v, hint) {
    if (!this.isOp(v)) this.err(`Expected “${v}” but found ${this.desc(this.peek())}.`, this.peek(), hint);
    return this.next();
  }
  skipNl() {
    while (this.is('nl')) this.next();
  }
  endOfStatement(what) {
    if (this.is('nl') || this.is('eof')) {
      if (this.is('nl')) this.next();
      return;
    }
    const tok = this.peek();
    if (tok.t === 'op' && tok.v === '=' ) this.err(`Unexpected “=” here.`, tok, 'Use == to compare two values; a single = assigns.');
    this.err(`Unexpected ${this.desc(tok)} after ${what}.`, tok, 'Put each statement on its own line.');
  }

  program() {
    const body = [];
    const funcs = {};
    this.skipNl();
    while (!this.is('eof')) {
      if (this.isKw('function')) {
        const f = this.funcDef();
        if (Object.prototype.hasOwnProperty.call(funcs, f.name)) this.err(`The function ${f.name} is defined twice (first on line ${funcs[f.name].line}).`, { line: f.line, col: 1 });
        funcs[f.name] = f;
      } else body.push(this.statement());
      this.skipNl();
    }
    return { body, funcs };
  }

  /** Parse statements until one of the terminators is at the start of a line. */
  block(open, terminators) {
    const body = [];
    this.skipNl();
    while (true) {
      const tok = this.peek();
      if (tok.t === 'eof') {
        this.err(`The ${BLOCK_NAMES[open.kind]} on line ${open.line} is never closed.`, tok, open.kind === 'repeat' ? 'Finish it with a line “until condition”.' : open.kind === 'do' ? 'Finish it with a line “while condition”.' : 'Add a line with just “end” after its body.');
      }
      if (tok.t === 'kw' && terminators.includes(tok.v)) return body;
      if (tok.t === 'kw' && ['endif', 'endwhile', 'endfor', 'endfunction'].includes(tok.v) && terminators.includes('end')) return body;
      // a `while cond` line without `do` closes a do-block
      if (open.kind === 'do' && tok.t === 'kw' && tok.v === 'while' && !this.lineEndsWith('do')) return body;
      if (tok.t === 'kw' && ['end', 'endif', 'endwhile', 'endfor', 'endfunction', 'else', 'elif', 'elseif', 'until'].includes(tok.v)) {
        this.err(`“${tok.raw || tok.v}” doesn’t match the open ${BLOCK_NAMES[open.kind]} from line ${open.line}.`, tok, open.kind === 'repeat' ? 'A repeat block ends with “until condition”.' : open.kind === 'do' ? 'A do block ends with “while condition”.' : 'Check that every if/while/for has exactly one end.');
      }
      if (tok.t === 'kw' && tok.v === 'function') this.err('Functions must be defined at the top level, not inside another block.', tok);
      body.push(this.statement());
      this.skipNl();
    }
  }

  lineEndsWith(word) {
    let j = this.i;
    let last = null;
    while (j < this.t.length && this.t[j].t !== 'nl' && this.t[j].t !== 'eof') last = this.t[j++];
    return !!last && last.t === 'kw' && last.v === word;
  }

  /** `end`, `end if`, `endif` … — checks the optional block word matches. */
  closeBlock(open) {
    const tok = this.next();
    const want = BLOCK_NAMES[open.kind];
    let word = null;
    if (tok.v !== 'end') word = tok.v.slice(3);
    else if ((this.is('kw') || this.is('name')) && ['if', 'while', 'for', 'function'].includes(String(this.peek().v).toLowerCase())) word = String(this.next().v).toLowerCase();
    if (word && word !== want) this.err(`This “end ${word}” closes the ${want} that started on line ${open.line}.`, tok, `Write “end ${want}” (or just “end”).`);
    this.endOfStatement('end');
    return tok.line;
  }

  funcDef() {
    const kw = this.next();
    if (this.blocks.length) this.err('Functions must be defined at the top level.', kw);
    if (!this.is('name')) this.err('Expected the function’s name after “function”.', this.peek(), 'Example: function insertFront(x)');
    const name = this.next().v;
    this.expectOp('(', `Example: function ${name}(p)`);
    const params = [];
    if (!this.isOp(')')) {
      while (true) {
        if (!this.is('name')) this.err(`Expected a parameter name but found ${this.desc(this.peek())}.`, this.peek(), 'Parameters are plain names: function f(p, x)');
        const p = this.next().v;
        if (params.includes(p)) this.err(`The parameter ${p} is listed twice.`);
        params.push(p);
        if (this.isOp(',')) {
          this.next();
          continue;
        }
        break;
      }
    }
    this.expectOp(')', 'Close the parameter list with “)”.');
    this.endOfStatement('the function header');
    const open = { kind: 'function', line: kw.line };
    this.blocks.push(open);
    this.inFunction++;
    const body = this.block(open, ['end']);
    this.inFunction--;
    this.blocks.pop();
    const endLine = this.closeBlock(open);
    return { t: 'func', name, params, body, line: kw.line, endLine };
  }

  statement() {
    const tok = this.peek();
    if (tok.t === 'kw') {
      switch (tok.v) {
        case 'if':
          return this.ifStmt();
        case 'while':
          return this.whileStmt();
        case 'for':
          return this.forStmt();
        case 'repeat':
        case 'do':
          return this.repeatStmt();
        case 'return': {
          this.next();
          if (!this.inFunction) this.err('“return” can only be used inside a function.', tok);
          const expr = this.is('nl') || this.is('eof') ? null : this.expr();
          this.endOfStatement('return');
          return { t: 'return', expr, line: tok.line };
        }
        case 'break':
        case 'continue':
          this.next();
          if (!this.loopDepth) this.err(`“${tok.v}” can only be used inside a loop.`, tok);
          this.endOfStatement(tok.v);
          return { t: tok.v, line: tok.line };
        case 'print': {
          this.next();
          const args = this.printArgs();
          this.endOfStatement('print');
          return { t: 'print', args, line: tok.line };
        }
        case 'delete':
        case 'free': {
          this.next();
          if (this.is('nl') || this.is('eof')) this.err(`“${tok.v}” needs the pointer to the node to delete.`, tok, `Example: ${tok.v} temp`);
          const expr = this.expr();
          this.endOfStatement(tok.v);
          return { t: 'delete', expr, line: tok.line };
        }
        case 'function':
          this.err('Functions must be defined at the top level.', tok);
          break;
        case 'end':
        case 'endif':
        case 'endwhile':
        case 'endfor':
        case 'endfunction':
        case 'else':
        case 'elif':
        case 'elseif':
        case 'until':
          this.err(`This “${tok.raw || tok.v}” doesn’t belong to anything — there is no open if/while/for/function here.`, tok, 'Remove it, or check the block it should close.');
          break;
        case 'then':
          this.err('“then” must come at the end of an if line.', tok);
          break;
        default:
          break;
      }
    }
    if (tok.t === 'name' && TYPE_WORDS.has(tok.v.toLowerCase()) && (this.peek(1).t === 'name' || (this.peek(1).t === 'op' && this.peek(1).v === '*'))) {
      this.err(`Variables don’t need a type like “${tok.v}”.`, tok, 'Just assign: x = 5, or p = new Node(10).');
    }
    if (tok.t === 'name' && tok.v === 'malloc') this.err('There is no malloc here.', tok, 'Create a node with new Node(value).');
    // assignment or call
    const target = this.expr();
    if (this.isOp('=') || this.isOp(':=') || this.isOp('+=') || this.isOp('-=')) {
      const opTok = this.next();
      if (!['var', 'field', 'index'].includes(target.t)) this.err('You can only assign to a variable, a field such as p.next, or an array slot a[i].', opTok);
      if (this.is('nl') || this.is('eof')) this.err('Nothing after “=”.', this.peek(), 'Write the value to assign, e.g. p = p.next');
      const expr = this.expr();
      this.endOfStatement('the assignment');
      return { t: 'assign', target, op: opTok.v === ':=' ? '=' : opTok.v, expr, line: tok.line };
    }
    if (this.isOp('++') || this.isOp('--')) {
      const o = this.peek();
      this.err(`“${o.v}” is not supported.`, o, `Write ${exprText(target)} = ${exprText(target)} ${o.v[0]} 1`);
    }
    if (target.t === 'bin' && target.op === '==' && target.a.t !== 'call') this.err('This line compares two values but does nothing with the result.', tok, 'To assign, use a single = (for example cur = cur.next).');
    if (target.t !== 'call') this.err('This line computes a value but does nothing with it.', tok, 'Assign it (x = …), print it, or call a function.');
    this.endOfStatement('the call');
    return { t: 'expr', expr: target, line: tok.line };
  }

  printArgs() {
    if (this.is('nl') || this.is('eof')) return [];
    // print(a, b) — call-style arguments
    if (this.isOp('(')) {
      const save = this.i;
      try {
        this.next();
        const args = [];
        if (!this.isOp(')')) {
          args.push(this.expr());
          while (this.isOp(',')) {
            this.next();
            args.push(this.expr());
          }
        }
        this.expectOp(')');
        if (this.is('nl') || this.is('eof')) return args;
      } catch {
        /* fall back to an ordinary expression list */
      }
      this.i = save;
    }
    const args = [this.expr()];
    while (this.isOp(',')) {
      this.next();
      args.push(this.expr());
    }
    return args;
  }

  needWord(word, what, example) {
    if (this.isKw(word)) {
      this.next();
      return;
    }
    const tok = this.peek();
    if (tok.t === 'nl' || tok.t === 'eof') this.err(`The ${what} line is missing “${word}” at the end.`, tok, `Example: ${example}`);
    if (tok.t === 'op' && tok.v === '=') this.err('Unexpected “=” in a condition.', tok, 'Use == to compare (a single = assigns).');
    this.err(`Expected “${word}” but found ${this.desc(tok)}.`, tok, `Example: ${example}`);
  }

  ifStmt() {
    const kw = this.next();
    const open = { kind: 'if', line: kw.line };
    this.blocks.push(open);
    const arms = [];
    let cond = this.expr();
    this.needWord('then', 'if', 'if cur == NULL then');
    if (!this.is('nl') && !this.is('eof')) this.err('Put the body of the if on the following lines and close it with end.', this.peek());
    let body = this.block(open, ['else', 'elif', 'elseif', 'end']);
    arms.push({ cond, body, line: kw.line });
    let elseBody = null;
    let elseLine = null;
    while (true) {
      const tok = this.peek();
      if (tok.v === 'elif' || tok.v === 'elseif' || (tok.v === 'else' && this.peek(1).t === 'kw' && this.peek(1).v === 'if')) {
        this.next();
        if (tok.v === 'else') this.next();
        if (elseBody) this.err('“else if” cannot come after the final “else”.', tok);
        cond = this.expr();
        this.needWord('then', 'else if', 'else if cur.next == NULL then');
        body = this.block(open, ['else', 'elif', 'elseif', 'end']);
        arms.push({ cond, body, line: tok.line });
        continue;
      }
      if (tok.v === 'else') {
        if (elseBody) this.err('An if can only have one “else”.', tok);
        this.next();
        elseLine = tok.line;
        if (!this.is('nl') && !this.is('eof')) this.err('Put the else branch on the following lines.', this.peek());
        elseBody = this.block(open, ['end']);
        continue;
      }
      break;
    }
    this.blocks.pop();
    const endLine = this.closeBlock(open);
    return { t: 'if', arms, elseBody, elseLine, line: kw.line, endLine };
  }

  whileStmt() {
    const kw = this.next();
    const open = { kind: 'while', line: kw.line };
    const cond = this.expr();
    this.needWord('do', 'while', 'while cur != NULL do');
    this.endOfStatement('“do”');
    this.blocks.push(open);
    this.loopDepth++;
    const body = this.block(open, ['end']);
    this.loopDepth--;
    this.blocks.pop();
    const endLine = this.closeBlock(open);
    return { t: 'while', cond, body, line: kw.line, endLine };
  }

  forStmt() {
    const kw = this.next();
    const open = { kind: 'for', line: kw.line };
    if (this.is('name') && this.peek().v.toLowerCase() === 'each') {
      this.next();
      if (!this.is('name')) this.err('Expected a loop variable after “for each”.', this.peek(), 'Example: for each w in neighbors(G, v) do');
      const v = this.next().v;
      if (!(this.is('name') && this.peek().v.toLowerCase() === 'in')) this.err(`Expected “in” after “for each ${v}”.`, this.peek(), 'Example: for each w in neighbors(G, v) do');
      this.next();
      const coll = this.expr();
      this.needWord('do', 'for each', 'for each w in neighbors(G, v) do');
      this.endOfStatement('“do”');
      this.blocks.push(open);
      this.loopDepth++;
      const body = this.block(open, ['end']);
      this.loopDepth--;
      this.blocks.pop();
      const endLine = this.closeBlock(open);
      return { t: 'foreach', var: v, coll, body, line: kw.line, endLine };
    }
    if (!this.is('name')) this.err('Expected a loop variable after “for”.', this.peek(), 'Example: for i = 1 to 5 do');
    const v = this.next().v;
    if (!this.isOp('=') && !this.isOp(':=')) this.err(`Expected “=” after “for ${v}”.`, this.peek(), 'Example: for i = 1 to 5 do');
    this.next();
    const from = this.expr();
    if (!(this.is('name') && this.peek().v.toLowerCase() === 'to')) this.err('Expected “to” in the for loop.', this.peek(), 'Example: for i = 1 to 5 do');
    this.next();
    const to = this.expr();
    let step = null;
    if (this.is('name') && this.peek().v.toLowerCase() === 'step') {
      this.next();
      step = this.expr();
    }
    this.needWord('do', 'for', 'for i = 1 to 5 do');
    this.endOfStatement('“do”');
    this.blocks.push(open);
    this.loopDepth++;
    const body = this.block(open, ['end']);
    this.loopDepth--;
    this.blocks.pop();
    const endLine = this.closeBlock(open);
    return { t: 'for', var: v, from, to, step, body, line: kw.line, endLine };
  }

  repeatStmt() {
    const kw = this.next();
    const kind = kw.v === 'do' ? 'do' : 'repeat';
    if (!this.is('nl') && !this.is('eof')) this.err(`“${kw.v}” must be alone on its line; the body follows on the next lines.`, this.peek());
    const open = { kind, line: kw.line };
    this.blocks.push(open);
    this.loopDepth++;
    // a do-block is closed by a `while cond` line WITHOUT a trailing `do` (see block())
    const body = this.block(open, kind === 'do' ? [] : ['until']);
    this.loopDepth--;
    this.blocks.pop();
    const endTok = this.next(); // until / while
    const cond = this.expr();
    this.endOfStatement(endTok.v);
    return { t: 'repeat', body, cond, stopWhen: kind === 'repeat', line: kw.line, condLine: endTok.line };
  }

  // ---------------------------------------------------------------- expressions
  expr() {
    return this.orExpr();
  }
  orExpr() {
    let a = this.andExpr();
    while (this.isKw('or') || this.isOp('or')) {
      const tok = this.next();
      a = { t: 'bin', op: 'or', a, b: this.andExpr(), line: tok.line, col: tok.col };
    }
    return a;
  }
  andExpr() {
    let a = this.notExpr();
    while (this.isKw('and') || this.isOp('and')) {
      const tok = this.next();
      a = { t: 'bin', op: 'and', a, b: this.notExpr(), line: tok.line, col: tok.col };
    }
    return a;
  }
  notExpr() {
    if (this.isKw('not') || this.isOp('!')) {
      const tok = this.next();
      return { t: 'un', op: 'not', a: this.notExpr(), line: tok.line, col: tok.col };
    }
    return this.cmpExpr();
  }
  cmpExpr() {
    const a = this.addExpr();
    const cmp = ['==', '!=', '<', '<=', '>', '>='];
    if (this.is('op') && cmp.includes(this.peek().v)) {
      const tok = this.next();
      const b = this.addExpr();
      if (this.is('op') && cmp.includes(this.peek().v)) this.err('Comparisons can’t be chained like a < b < c.', this.peek(), 'Write a < b and b < c.');
      return { t: 'bin', op: tok.v, a, b, line: tok.line, col: tok.col };
    }
    return a;
  }
  addExpr() {
    let a = this.mulExpr();
    while (this.isOp('+') || this.isOp('-')) {
      const tok = this.next();
      a = { t: 'bin', op: tok.v, a, b: this.mulExpr(), line: tok.line, col: tok.col };
    }
    return a;
  }
  mulExpr() {
    let a = this.unary();
    while (this.isOp('*') || this.isOp('/') || this.isOp('%') || this.isKw('mod') || this.isKw('div')) {
      const tok = this.next();
      const op = tok.v === 'mod' ? '%' : tok.v === 'div' ? 'div' : tok.v;
      a = { t: 'bin', op, a, b: this.unary(), line: tok.line, col: tok.col };
    }
    return a;
  }
  unary() {
    if (this.isOp('-')) {
      const tok = this.next();
      return { t: 'un', op: '-', a: this.unary(), line: tok.line, col: tok.col };
    }
    if (this.isOp('*') || this.isOp('&')) this.err('Pointer operators * and & are not used here.', this.peek(), 'A variable holding a node already is the pointer; follow it with p.next.');
    return this.postfix();
  }
  postfix() {
    let e = this.primary();
    while (true) {
      if (this.isOp('.') || this.isOp('->')) {
        const tok = this.next();
        if (!this.is('name') && !this.is('kw')) this.err(`Expected a field name after “${tok.v}”.`, this.peek(), 'Fields are data, next, and (for some structures) left/right or prev.');
        const f = this.next();
        e = { t: 'field', obj: e, name: f.t === 'kw' ? f.raw || f.v : f.v, arrow: tok.v === '->', line: f.line, col: f.col };
        continue;
      }
      if (this.isOp('[')) {
        const tok = this.next();
        const idx = this.expr();
        this.expectOp(']', 'Close the index with “]”.');
        e = { t: 'index', obj: e, idx, line: tok.line, col: tok.col };
        continue;
      }
      if (this.isOp('(')) {
        const tok = this.peek();
        if (e.t !== 'var') this.err('Only named functions can be called.', tok);
        if (e.name === 'malloc' || e.name === 'sizeof') this.err(`There is no ${e.name} here.`, { line: e.line, col: e.col }, 'Create a node with new Node(value).');
        this.next();
        const args = this.args();
        e = { t: 'call', name: e.name, args, line: e.line, col: e.col };
        continue;
      }
      return e;
    }
  }
  args() {
    const args = [];
    if (!this.isOp(')')) {
      args.push(this.expr());
      while (this.isOp(',')) {
        this.next();
        args.push(this.expr());
      }
    }
    this.expectOp(')', 'Close the argument list with “)”.');
    return args;
  }
  primary() {
    const tok = this.peek();
    if (tok.t === 'num') {
      this.next();
      return { t: 'num', v: tok.v, line: tok.line, col: tok.col };
    }
    if (tok.t === 'str') {
      this.next();
      return { t: 'str', v: tok.v, line: tok.line, col: tok.col };
    }
    if (tok.t === 'name') {
      this.next();
      return { t: 'var', name: tok.v, line: tok.line, col: tok.col };
    }
    if (tok.t === 'kw') {
      if (tok.v === 'true' || tok.v === 'false') {
        this.next();
        return { t: 'bool', v: tok.v === 'true', line: tok.line, col: tok.col };
      }
      if (tok.v === 'null' || tok.v === 'nil') {
        this.next();
        return { t: 'null', line: tok.line, col: tok.col };
      }
      if (tok.v === 'new') {
        this.next();
        if (!this.is('name')) this.err('Expected what to create after “new”.', this.peek(), 'Example: new Node(15)');
        const what = this.next();
        const ctor = CONSTRUCTORS.find((c) => c.toLowerCase() === what.v.toLowerCase());
        if (!ctor) this.err(`The lab can’t create “${what.v}”.`, what, `It can create: ${CONSTRUCTORS.join(', ')}.`);
        let args = [];
        if (this.isOp('(')) {
          this.next();
          args = this.args();
        }
        return { t: 'new', what: ctor === 'List' ? 'Array' : ctor, args, line: tok.line, col: tok.col };
      }
    }
    if (tok.t === 'op' && tok.v === '(') {
      this.next();
      const e = this.expr();
      this.expectOp(')', 'Every “(” needs a matching “)”.');
      return e;
    }
    if (tok.t === 'op' && tok.v === '[') {
      this.next();
      const items = [];
      if (!this.isOp(']')) {
        items.push(this.expr());
        while (this.isOp(',')) {
          this.next();
          items.push(this.expr());
        }
      }
      this.expectOp(']', 'Close the list with “]”.');
      return { t: 'list', items, line: tok.line, col: tok.col };
    }
    if (tok.t === 'nl' || tok.t === 'eof') this.err('This line ends too early — a value is missing.', tok);
    if (tok.t === 'kw') this.err(`“${tok.raw || tok.v}” is a reserved word and can’t be used here.`, tok, ['end', 'then', 'do'].includes(tok.v) ? 'Did you forget a value or a condition before it?' : 'Rename your variable if you meant one.');
    this.err(`Unexpected ${this.desc(tok)}.`, tok);
    return null;
  }
}

/** Parse source into { body, funcs }. Throws LabError('syntax'). */
export function parse(src) {
  const p = new Parser(tokenize(src));
  return p.program();
}

/** Returns null when the code parses, otherwise the LabError. */
export function syntaxCheck(src) {
  try {
    parse(src);
    return null;
  } catch (e) {
    if (e instanceof LabError) return e;
    throw e;
  }
}

/** Source-like text for an expression (used in explanations). */
export function exprText(e) {
  if (!e) return '';
  switch (e.t) {
    case 'num':
      return String(e.v);
    case 'str':
      return JSON.stringify(e.v);
    case 'bool':
      return e.v ? 'true' : 'false';
    case 'null':
      return 'NULL';
    case 'var':
      return e.name;
    case 'field':
      return `${exprText(e.obj)}${e.arrow ? '->' : '.'}${e.name}`;
    case 'index':
      return `${exprText(e.obj)}[${exprText(e.idx)}]`;
    case 'call':
      return `${e.name}(${e.args.map(exprText).join(', ')})`;
    case 'new':
      return `new ${e.what}(${e.args.map(exprText).join(', ')})`;
    case 'list':
      return `[${e.items.map(exprText).join(', ')}]`;
    case 'un':
      return e.op === 'not' ? `not ${exprText(e.a)}` : `-${exprText(e.a)}`;
    case 'bin': {
      const wrap = (x) => (x.t === 'bin' ? `(${exprText(x)})` : exprText(x));
      return `${wrap(e.a)} ${e.op === '%' ? 'mod' : e.op} ${wrap(e.b)}`;
    }
    default:
      return '?';
  }
}

// ---------------------------------------------------------------- editor helpers

const OPENERS = /^(if\b.*\bthen|while\b.*\bdo|for\b.*\bdo|function\b|repeat|do)\s*$/i;

/** Re-indent the whole program by block structure (2 spaces per level). */
export function reindent(src, unit = '  ') {
  const out = [];
  const stack = [];
  for (const raw of String(src).replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    const code = line.replace(/(#|\/\/).*$/, '').trim();
    const low = code.toLowerCase();
    let depth = stack.length;
    const closesDo = stack[stack.length - 1] === 'do' && /^while\b/.test(low) && !/\bdo$/.test(low);
    if (/^(end\b|endif|endwhile|endfor|endfunction|until\b)/.test(low) || closesDo) {
      stack.pop();
      depth = stack.length;
    } else if (/^(else\b|elif\b|elseif\b)/.test(low)) depth = Math.max(0, stack.length - 1);
    out.push(line ? unit.repeat(depth) + line : '');
    if (OPENERS.test(code)) stack.push(/^(repeat|do)$/i.test(code) ? low : 'block');
  }
  return out.join('\n');
}

/** Indentation to use after pressing Enter at the end of `line`. */
export function nextIndent(line, unit = '  ') {
  const cur = /^\s*/.exec(line)[0];
  const code = line.replace(/(#|\/\/).*$/, '').trim();
  if (OPENERS.test(code) || /^(else|elif\b.*then|elseif\b.*then|else\s+if\b.*then)$/i.test(code)) return cur + unit;
  return cur;
}

const BUILTIN_NAMES = new Set(['neighbors', 'vertices', 'degree', 'hasEdge', 'enqueue', 'dequeue', 'push', 'pop', 'peek', 'isEmpty', 'size', 'length', 'add', 'contains', 'remove', 'append', 'abs', 'min', 'max']);

/** Split one source line into highlight spans: [{cls, text}] (cls '' = plain). */
export function highlightLine(text) {
  const out = [];
  const push = (cls, t) => t && out.push({ cls, text: t });
  let i = 0;
  let prevSig = '';
  while (i < text.length) {
    const rest = text.slice(i);
    let m;
    if ((m = /^(#|\/\/).*/.exec(rest))) {
      push('tk-com', m[0]);
      break;
    }
    if ((m = /^\s+/.exec(rest))) push('', m[0]);
    else if ((m = /^("[^"]*"?|'[^']*'?|“[^”]*”?)/.exec(rest))) push('tk-str', m[0]);
    else if ((m = /^\d+(\.\d+)?/.exec(rest))) push('tk-num', m[0]);
    else if ((m = /^[A-Za-z_]\w*/.exec(rest))) {
      const w = m[0];
      const low = w.toLowerCase();
      const after = text.slice(i + w.length);
      let cls = '';
      if (prevSig === '.' || prevSig === '->') cls = 'tk-field';
      else if (['null', 'nil', 'true', 'false'].includes(low)) cls = 'tk-lit';
      else if (KEYWORDS.has(low)) cls = 'tk-kw';
      else if (CONSTRUCTORS.includes(w) && /^\s*\(/.test(after)) cls = 'tk-type';
      else if (/^\s*\(/.test(after)) cls = BUILTIN_NAMES.has(w) ? 'tk-builtin' : 'tk-fn';
      push(cls, w);
    } else if ((m = /^(->|==|!=|<>|<=|>=|:=|\+=|-=|&&|\|\||[←≠≤≥→]|[-+*/%<>=!.,()[\];{}])/.exec(rest))) push('tk-op', m[0]);
    else {
      push('', rest[0]);
      m = [rest[0]];
    }
    const len = m ? m[0].length : 1;
    const piece = text.slice(i, i + len);
    if (piece.trim()) prevSig = piece.trim();
    i += len;
  }
  return out;
}
