import { Heap } from 'heap-js';

const pq = new Heap((a, b) => a.stopprice - b.stopprice);

pq.push({ stopprice: 10, name: 'task1' });
pq.push({ stopprice: 5, name: 'task2' });
pq.push({ stopprice: 20, name: 'task3' });

console.log(pq.pop());
console.log(pq.pop()); 
console.log(pq.pop()); 