$(document).ready(function(){

    // network = "max_pfe"
    network = "small"

    colour_brewer = ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628","#f781bf","#999999"];

    deleted_nodes = [];

    $.getJSON("json/"+network+".json", function(data) {updateGraph(data)});

    // Make the graph export work
    // $('#export').click(function() {
    //     var imgBlob = new Blob([cy.svg()], {type: 'image/svg+xml'});

    //     saveAs( imgBlob, 'collaborations.svg');
    // })


    $("#search").click(function(){
        // Put everything back
        cy.add(deleted_nodes)

        // Get the gene name from the search
        var gene = $("#genename").val()

        if (gene.length==0) {
            return;
        }
        // Get the node for that gene
        var genenode = cy.getElementById(gene);

        // Make a node group
        var connected_nodes = genenode;

        // Add the upstream and downstream nodes
        connected_nodes = connected_nodes.union(genenode.predecessors());
        connected_nodes = connected_nodes.union(genenode.successors());

        // Get the nodes not in this set and remove them
        deleted_nodes = cy.elements().not(connected_nodes);
        cy.remove(deleted_nodes);
    });

}); 

function updateGraph (network_data) {

    cy = cytoscape({

        container: document.getElementById('network'), // container to render in
        
        elements: network_data,
        
        style: [ // the stylesheet for the graph
        {
            selector: 'node',
            style: {
            'background-color': '#B22',
            'background-color': function(ele){return colour_brewer[ele.data('group')]},
            'label': 'data(id)',
            'shape': 'ellipse'
            }
        },
        
        {
            selector: 'edge',
            style: {
            // 'width': "mapData(weight,1,"+maxWeight+",1,10)",
            // 'line-color': "mapData(weight,1,"+maxWeight+",#CCC,#222)",
            'curve-style': 'bezier'
            }
        }
        ],
        
        layout: {
            name: 'grid',
            randomize: true,
            animate: true, 
            idealEdgeLength: 250,
            nodeRepulsion: 2048
        }
        
        });
}