import { solveRewire } from '../app/js/exercises/solver.js';

export function modelResponse(ex) {
  switch (ex.kind) {
    case 'mcq':
    case 'multi':
    case 'numeric':
    case 'sequence':
    case 'nodepick':
    case 'order':
    case 'fill':
    case 'fields':
    case 'matrix':
    case 'adjlist':
    case 'graphdraw':
    case 'treebuild':
      return ex.answer;
    case 'text':
      return ex.answer.join(' ');
    case 'rewire':
      return solveRewire(ex).actions;
    default:
      throw new Error('no model response for kind ' + ex.kind);
  }
}

