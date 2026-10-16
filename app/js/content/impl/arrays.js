// "Build it in code": arrays (Lecture 07). See ./format.js.

export const ARRAY_EXAMPLES = [
  {
    id: 'array-shift',
    lecture: 7,
    structure: 'arrays',
    title: 'An array with insertion and deletion by shifting',
    ref: 'Lec 07 p.2–4',
    intro: 'An array is one block of MAX slots side by side. The block never grows, so a separate count `n` remembers how many slots are in use. Inserting makes room by moving the later elements one slot RIGHT (starting from the end); deleting closes the gap by moving them one slot LEFT.',
    params: { max: 6, v1: 10, v2: 30, v3: 20, v4: 5 },
    vary: ['v1', 'v2', 'v3', 'v4'],
    cases: [
      { label: 'Room for 6', setup: { values: [] }, params: { max: 6 } },
      { label: 'Room for 3 (it fills up)', setup: { values: [] }, params: { max: 3 } },
    ],
    pseudo: `# a is an array with room for MAX values; n counts the slots in use.
@s1|MAX = {{max}}
@s2|a = new Array(MAX)
@s3|n = 0

@fi|function insert_at(pos, value)
@i1|    if n == MAX then
@i2|        print "array full"
@i3|        return
    end if
@i4|    i = n
@i5|    while i > pos do
@i6|        a[i] = a[i - 1]          # move one slot RIGHT, from the end backwards
@i7|        i = i - 1
    end while
@i8|    a[pos] = value
@i9|    n = n + 1
@fi_end|end function

@fx|function delete_at(pos)
@x1|    i = pos
@x2|    while i < n - 1 do
@x3|        a[i] = a[i + 1]          # move one slot LEFT over the deleted value
@x4|        i = i + 1
    end while
@x5|    n = n - 1
@fx_end|end function

@fp|function display()
@p1|    for i = 0 to n - 1 do
@p2|        print a[i]
    end for
@fp_end|end function

@m1|insert_at(0, {{v1}})
@m2|insert_at(1, {{v2}})
@m3|insert_at(1, {{v3}})              # goes between the first two values
@m4|insert_at(0, {{v4}})               # everything moves right
@m5|delete_at(1)                  # the value in slot 1 disappears, the rest moves left
@m6|display()`,
    cpp: `#include <iostream>
using namespace std;

@s1|const int MAX = {{max}};
@s2|int a[MAX];          // MAX ints side by side in memory; the size is fixed
@s3|int n = 0;           // how many slots are in use

@fi|void insert_at(int pos, int value) {
@i1|    if (n == MAX) {
@i2|        cout << "array full\\n";
@i3|        return;
    }
@i4|    int i = n;
@i5|    while (i > pos) {
@i6|        a[i] = a[i - 1];         // move one slot RIGHT, from the end backwards
@i7|        i = i - 1;
    }
@i8|    a[pos] = value;
@i9|    n = n + 1;
@fi_end|}

@fx|void delete_at(int pos) {
@x1|    int i = pos;
@x2|    while (i < n - 1) {
@x3|        a[i] = a[i + 1];         // move one slot LEFT over the deleted value
@x4|        i = i + 1;
    }
@x5|    n = n - 1;
@fx_end|}

@fp|void display() {
@p1|    for (int i = 0; i < n; i++)
@p2|        cout << a[i] << "\\n";
@fp_end|}

int main() {
@m1|    insert_at(0, {{v1}});
@m2|    insert_at(1, {{v2}});
@m3|    insert_at(1, {{v3}});            // goes between the first two values
@m4|    insert_at(0, {{v4}});             // everything moves right
@m5|    delete_at(1);                // the value in slot 1 disappears, the rest moves left
@m6|    display();
}`,
    py: `@s1|MAX = {{max}}
@s2|a = [None] * MAX         # a block of MAX slots; we never let the list grow or shrink
@s3|n = 0                    # how many slots are in use

@fi,fi_end|def insert_at(pos, value):
    global n
@i1|    if n == MAX:
@i2|        print("array full")
@i3|        return
@i4|    i = n
@i5|    while i > pos:
@i6|        a[i] = a[i - 1]      # move one slot RIGHT, from the end backwards
@i7|        i = i - 1
@i8|    a[pos] = value
@i9|    n = n + 1

@fx,fx_end|def delete_at(pos):
    global n
@x1|    i = pos
@x2|    while i < n - 1:
@x3|        a[i] = a[i + 1]      # move one slot LEFT over the deleted value
@x4|        i = i + 1
@x5|    n = n - 1

@fp,fp_end|def display():
@p1|    for i in range(n):
@p2|        print(a[i])

@m1|insert_at(0, {{v1}})
@m2|insert_at(1, {{v2}})
@m3|insert_at(1, {{v3}})             # goes between the first two values
@m4|insert_at(0, {{v4}})              # everything moves right
@m5|delete_at(1)                 # the value in slot 1 disappears, the rest moves left
@m6|display()`,
    notes: {
      s2: '**One contiguous block.** C++ `int a[MAX]` reserves MAX ints side by side. Python has no fixed-size array type in the core language, so a list of MAX slots stands in for one — the program never calls append or insert, so the slots behave like an array. The pseudocode `new Array(MAX)` is the Lab’s array.',
      s3: 'The array cannot tell how many slots hold real data, so the program keeps its own count n.',
      i1: 'Full: there is no free slot, and a plain array cannot grow (Lec 07 p.2).',
      i4: 'Start at the first free slot…',
      i6: '…and move each element one slot right. Going from the END backwards means nothing is overwritten before it has been moved.',
      i8: 'The gap at pos is now free.',
      i9: 'One more slot is in use.',
      x3: 'Each later element moves one slot left, covering the deleted value. Correction to Lec 07: deleting from an array IS possible — what cannot change is the size of the block.',
      x5: 'The last slot is now unused (its old value may still be there, but it is outside 0 … n − 1).',
      p1: 'Only slots 0 … n − 1 hold values.',
    },
    blanks: [
      {
        label: 'i6',
        why: 'Each element moves one slot to the right to open a gap at pos.',
        wrong: [
          { cpp: 'a[i - 1] = a[i];', py: 'a[i - 1] = a[i]', pseudo: 'a[i - 1] = a[i]', why: 'That copies to the LEFT and overwrites values before they are moved.', tag: 'array-shift' },
          { cpp: 'a[i] = a[i + 1];', py: 'a[i] = a[i + 1]', pseudo: 'a[i] = a[i + 1]', why: 'That is the deletion shift (to the left).', tag: 'array-shift' },
        ],
      },
      {
        label: 'x3',
        why: 'Each later element moves one slot to the left, over the deleted one.',
        wrong: [
          { cpp: 'a[i + 1] = a[i];', py: 'a[i + 1] = a[i]', pseudo: 'a[i + 1] = a[i]', why: 'That copies the deleted value to the right instead of removing it.', tag: 'array-shift' },
        ],
      },
    ],
  },
];
