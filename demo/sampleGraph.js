// const graphElements = [
//     { data: { id: 'a',isDirected:1 } },
//     { data: { id: 'b',isDirected:1 } },
//     { data: { id: 'c',isDirected:1 } },
//     { data: { id: 'd',isDirected:1 } },
//     { data: { id: 'e',isDirected:1 } },
//     { data: { id: 'ab', source: 'a', target: 'b' } },
//     { data: { id: 'ac', source: 'b', target: 'c' } },
//     { data: { id: 'cd', source: 'c', target: 'd' } },
//     { data: { id: 'be', source: 'b', target: 'e' } }
// ];
// window.graphElements = graphElements;


window.graphElements = {
    nodes: [
      {
        data: {
          id: "n1_1",
          isDirected:1
        },
      },
      {
        data: {
          id: "n1_2",
          isDirected:1
        },
      },
      {
        data: {
          id: "n2_1",
          isDirected:1
        },
      },
      {
        data: {
          id: "n2_2",
          isDirected:1
        },
      },
      {
        data: {
          id: "n2_3",
          isDirected:1
        },
      },
      {
        data: {
          id: "n2_4",
          isDirected:1
        },
      },
      {
        data: {
          id: "n3_1",
          isDirected:1
        },
      },
      {
        data: {
          id: "n3_2",
          isDirected:1
        },
      },
      {
        data: {
          id: "n3_3",
          isDirected:1
        },
      },
      {
        data: {
          id: "p_1",
          isDirected:1
        },
      },
      {
        data: {
          id: "p_2",
          isDirected:1
        },
      },
      {
        data: {
          id: "c_1",
          isDirected:0,
          parent: "p_1"
        },
      },
      {
        data: {
          id: "c_2",
          isDirected:0,
          parent: "p_1"
        },
      },
      {
        data: {
          id: "c_3",
          isDirected:0,
          parent: "p_2"
        },
      },
    ],
    edges: [
      {
        data: {
          source: "n1_1",
          target: "n2_2",
        },
      },
      {
        data: {
          source: "n1_2",
          target: "n2_1",
        },
      },
      {
        data: {
          source: "n1_2",
          target: "n2_2",
        },
      },
      {
        data: {
          source: "n2_1",
          target: "n3_3",
        },
      },
      {
        data: {
          source: "n2_2",
          target: "n3_1",
        },
      },
      {
        data: {
          source: "n2_2",
          target: "n3_2",
        },
      },
      {
        data: {
          source: "n2_2",
          target: "n3_3",
        },
      },
      {
        data: {
          source: "n2_3",
          target: "n3_3",
        },
      },
      {
        data: {
          source: "n2_4",
          target: "n3_3",
        },
      },
      {
        data: {
          source: "n2_4",
          target: "p_1",
        },
      },
      {
        data: {
          source: "n3_2",
          target: "p_2",
        },
      },
    ],
  };