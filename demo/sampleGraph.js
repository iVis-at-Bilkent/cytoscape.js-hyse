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
          id: "c_1",
          isDirected:0
        },
      },
      {
        data: {
          id: "c_2",
          isDirected:0
        },
      },
      {
        data: {
          id: "c_4",
          isDirected:0
        },
      },
      {
        data: {
          id: "c_5",
          isDirected:0
        },
      },
      {
        data: {
          id: "c_6",
          isDirected:0
        },
      },
      {
        data: {
          id: "c_7",
          isDirected:0
        },
      },
      {
        data: {
          id: "c_3",
          isDirected:0
        },
      },
      {
        data: {
          id: "c_8",
          isDirected:0
        },
      },
      {
        data: {
          id: "c_9",
          isDirected:0
        },
      },
      {
        data: {
          id: "c_10",
          isDirected:0
        },
      },
      {
        data: {
          id: "c_11",
          isDirected:0
        },
      },
      {
        data: {
          id: "c_12",
          isDirected:0
        },
      },
      {
        data: {
          id: "c_13",
          isDirected:0
        },
      },
      {
        data: {
          id: "c_14",
          isDirected:0
        },
      },
      {
        data: {
          id: "c_15",
          isDirected:0
        },
      },
      {
        data: {
          id: "c_16",
          isDirected:0
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
          source: "c_2",
          target: "c_4",
        },
      },
      {
        data: {
          source: "c_1",
          target: "c_4",
        },
      },
      {
        data: {
          source: "c_6",
          target: "c_7",
        },
      },
      {
        data: {
          source: "c_6",
          target: "c_3",
        },
      },
      {
        data: {
          source: "c_5",
          target: "c_2",
        },
      },

      {
        data: {
          source: "c_9",
          target: "c_11",
        },
      },
      {
        data: {
          source: "c_8",
          target: "c_11",
        },
      },
      {
        data: {
          source: "c_12",
          target: "c_13",
        },
      },
      {
        data: {
          source: "c_10",
          target: "c_9",
        },
      },
      {
        data: {
          source: "c_14",
          target: "c_15",
        },
      },
      {
        data: {
          source: "c_15",
          target: "c_16",
        },
      },
      {
        data: {
          source: "c_16",
          target: "c_14",
        },
      },
      {
        data: {
          source: "c_1",
          target: "c_5",
        },
      },
      {
        data: {
          source: "c_8",
          target: "c_10",
        },
      },
      {
        data: {
          source: "c_4",
          target: "c_5",
        },
      },
      {
        data: {
          source: "n2_3",
          target: "c_8",
        },
      },
      {
        data: {
          source: "n2_1",
          target: "c_1",
        },
      },
      {
        data: {
          source: "c_13",
          target: "c_15",
        },
      },
      {
        data: {
          source: "n1_1",
          target: "c_12",
        },
      },
      {
        data: {
          source: "c_5",
          target: "c_6",
        },
      },

    ],
  };
