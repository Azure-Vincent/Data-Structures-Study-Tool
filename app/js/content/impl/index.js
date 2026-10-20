// Registry of the "Build it in code" programs (see ./format.js).
import { ARRAY_EXAMPLES } from './arrays.js';
import { SLL_EXAMPLES } from './sll.js';
import { DLL_EXAMPLES } from './dll.js';
import { CSLL_EXAMPLES } from './csll.js';
import { STACK_QUEUE_EXAMPLES } from './stackqueue.js';
import { TREE_EXAMPLES } from './tree.js';
import { GRAPH_EXAMPLES } from './graph.js';

export const IMPLEMENTATIONS = [...ARRAY_EXAMPLES, ...SLL_EXAMPLES, ...DLL_EXAMPLES, ...CSLL_EXAMPLES, ...STACK_QUEUE_EXAMPLES, ...TREE_EXAMPLES, ...GRAPH_EXAMPLES];
export const IMPL_BY_ID = Object.fromEntries(IMPLEMENTATIONS.map((x) => [x.id, x]));
