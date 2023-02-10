// const graphElements = [
//     // { data: { id: 'a',isDirected:0 } },
//     { data: { id: 'b',isDirected:0 } },
//     { data: { id: 'c',isDirected:1 } },
//     { data: { id: 'd',isDirected:1 } },
//     { data: { id: '1',isDirected:0 } },
//     { data: { id: '2',isDirected:0 } },
//     { data: { id: 'de',isDirected:0 } },
//     { data: { id: 'e',isDirected:0 } },
//     { data: { id: 'f',isDirected:0 } },
//     { data: { id: 'g',isDirected:0 } },
//     // { data: { id: 'g',isDirected:0 } },
//     // { data: { id: 'h',isDirected:0 } },
//     // { data: { id: 'ab', source: 'a', target: 'b' } },
//     { data: { id: 'ac', source: 'b', target: 'c' } },
//     { data: { id: 'cd', source: 'c', target: 'd' } },
//     { data: { id: 'c2', source: 'c', target: '2' } },
//     { data: { id: 'bd', source: 'b', target: 'd' } },
//     { data: { id: '1de', source: 'de', target: '1' } },
//     { data: { id: '2de', source: 'de', target: '2' } },
//     { data: { id: '1d', source: '1', target: 'd' } },
//     { data: { id: 'dee', source: 'de', target: 'e' } },
//     { data: { id: 'ef', source: 'f', target: 'e' } },
//     // { data: { id: 'fh', source: 'f', target: 'h' } },
//     { data: { id: 'bg', source: 'g', target: 'b' } },
//     { data: { id: '12', source: '2', target: '1' } },
//     // { data: { id: 'e2', source: '2', target: 'e' } },
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
          isDirected:1,
          width:80,
          height:140,
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
          isDirected:1,
          width:100,
          height:80,
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
          isDirected:1,
          width:50,
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
          isDirected:0,
          width:50,
          height:50,
        },
      },
      {
        data: {
          id: "c_9",
          isDirected:0,
          width:80,
          height:80,
        },
      },
      {
        data: {
          id: "c_10",
          isDirected:0,
          height:60,
          width:50,
        },
      },
      {
        data: {
          id: "c_11",
          isDirected:0,
          width:50,
          height:60,
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
      {
        data: {
          id: "c_17",
          isDirected:0
        },
      },
      // {
      //   data: {
      //     id: "c_18",
      //     isDirected:0
      //   },
      // },
      {
        data: {
          id: "c_19",
          isDirected:0,
          parent: "c_5",
        },
      },
      {
        data: {
          id: "c_20",
          isDirected:0,
          parent: "c_3",
        },
      },
      {
        data: {
          id: "c_21",
          isDirected:0,
          parent: "c_5",
        },
      },
      {
        data: {
          id: "c_22",
          isDirected:0,
          parent: "c_5",
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
          source: "c_19",
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
          source: "c_15",
          target: "c_14",
        },
      },
      // {
      //   data: {
      //     source: "c_15",
      //     target: "c_16",
      //   },
      // },
      {
        data: {
          source: "c_16",
          target: "c_17",
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
          source: "n2_2",
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
          source: "n1_2",
          target: "c_13",
        },
      },
      {
        data: {
          source: "c_5",
          target: "c_6",
        },
      },
      // {
      //   data: {
      //     source: "c_19",
      //     target: "c_5",
      //   },
      // },
      // {
      //   data: {
      //     source: "c_15",
      //     target: "n2_3",
      //   },
      // },
      // {
      //   data: {
      //     source: "c_17",
      //     target: "n3_3",
      //   },
      // },
      // {
      //   data: {
      //     source: "c_14",
      //     target: "c_18",
      //   },
      // },
      // {
      //   data: {
      //     source: "c_14",
      //     target: "c_13",
      //   },
      // },
      {
        data: {
          source: "c_21",
          target: "c_19",
        },
      },
      {
        data: {
          source: "c_21",
          target: "c_22",
        },
      },
      {
        data: {
          source: "c_19",
          target: "c_22",
        },
      },
    ],
  };
