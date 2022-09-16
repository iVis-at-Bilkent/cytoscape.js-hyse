document.addEventListener("DOMContentLoaded", pageLoaded);
function pageLoaded() {
    //initialize cytoscapes
    const cy = cytoscape({
        container: document.getElementById('cy'),
        elements: [
            { data: { id: 'a' } },
            { data: { id: 'b' } },
            { data: { id: 'c' } },
            { data: { id: 'd' } },
            { data: { id: 'e' } },
            { data: { id: 'ab', source: 'a', target: 'b' } },
            { data: { id: 'ac', source: 'a', target: 'c' } },
            { data: { id: 'cd', source: 'c', target: 'd' } },
            { data: { id: 'be', source: 'b', target: 'e' } }
        ],
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': '#666',
                    'label': 'data(id)'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'line-color': '#ccc',
                    'target-arrow-color': '#ccc',
                    'target-arrow-shape': 'triangle'
                }
            }
        ]
    });
    //run cytoscapes cose layout
    cy.layout({
        name: 'cose',
        animate: true,
        animationDuration: 1000,
        animationEasing: undefined,
        fit: true,
        padding: 30,
        randomize: false,
        ready: undefined,
        stop: undefined
    }).run();
    window.cy = cy;

};

function runLayout() {
    //run cytoscapes cose layout
    cy.layout({
        name: 'cose',
        animate: true,
        animationDuration: 1000,
        animationEasing: undefined,
        fit: true,
        padding: 30,
        randomize: false,
        ready: undefined,
        stop: undefined
    }).run();
}

function addNode(){
    //get a random number between 0 and 1000
    var random = Math.floor(Math.random() * 1000);
    //get random positions for the new node
    var x = Math.floor(Math.random() * 1000);
    var y = Math.floor(Math.random() * 1000);
    //add the new node to the graph with data and position
    cy.add({
        group: "nodes",
        data: { id: random },
        position: { x: x, y: y }
    });
    cy.add({
        data:{id:'a-'+random,source:'a',target:random}
    });
    
}