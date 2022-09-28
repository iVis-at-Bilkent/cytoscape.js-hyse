const graphElements = [
    { data: { id: 'a',isDirected:0 } },
    { data: { id: 'b',isDirected:0 } },
    { data: { id: 'c',isDirected:0 } },
    { data: { id: 'd',isDirected:0 } },
    { data: { id: 'e',isDirected:0 } },
    { data: { id: 'ab', source: 'a', target: 'b' } },
    { data: { id: 'ac', source: 'a', target: 'c' } },
    { data: { id: 'cd', source: 'c', target: 'd' } },
    { data: { id: 'be', source: 'b', target: 'e' } }
];
window.graphElements = graphElements;
