$(document).ready(function(){

    $("#search").prop("disabled",true);

    network = "max_pfe"
    // network = "small"

    colour_brewer = ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628","#f781bf","#999999"];

    $.getJSON("json/"+network+".json", function(data) {$("#search").prop("disabled",false);network_data = data});

    // Make the graph export work
    // $('#export').click(function() {
    //     var imgBlob = new Blob([cy.svg()], {type: 'image/svg+xml'});

    //     saveAs( imgBlob, 'collaborations.svg');
    // })


    $("#search").click(function(){
        // Get the gene name from the search
        var gene = $("#genename").val()

        if (gene.length==0) {
            return;
        }

        var elements = [];
        var node_names = {};

        node_names[gene] = 1;

        // Go through the nodes.  We need all edges mentioning
        // this search
        for (i=0;i<network_data.length;i++) {
            if (network_data[i]["group"] == "edges") {
                if (network_data[i]["data"]["source"]==gene) {
                    elements.push(network_data[i]);
                    node_names[network_data[i]["data"]["target"]] = 1;
                }
                else if (network_data[i]["data"]["target"]==gene) {
                    elements.push(network_data[i]);
                    node_names[network_data[i]["data"]["source"]] = 1;
                }
            }
        }

        // Now do a second pass looking for the nodes we need.
        for (i=0;i<network_data.length;i++) {
            if (network_data[i]["group"] == "nodes") {
                if (network_data[i]["data"]["id"] in node_names) {
                    console.log(network_data[i]);
                    elements.unshift(network_data[i]);
                }
            }
        }

        updateGraph(elements)

    });

}); 

function updateGraph (data) {

    cy = cytoscape({

        container: document.getElementById('network'), // container to render in
        
        elements: data,
        
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
            'target-arrow-shape': function(ele){if (ele.data('weight')>0){return 'triangle'}else{return 'tee'}},
                // 'width': "mapData(weight,1,"+maxWeight+",1,10)",
            // 'line-color': "mapData(weight,1,"+maxWeight+",#CCC,#222)",
            'curve-style': 'bezier'
            }
        }
        ],
        
        layout: {
            name: 'grid',
            randomize: false,
            animate: false, 
            idealEdgeLength: 250,
            nodeRepulsion: 2048
        }
        
        });
}