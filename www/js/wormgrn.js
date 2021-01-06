$(document).ready(function(){

    network = "max_pfe"

    $.getJSON("json/"+network+".json", function(data) {updateGraph(data)});

    // Make the graph export work
    // $('#export').click(function() {
    //     var imgBlob = new Blob([cy.svg()], {type: 'image/svg+xml'});

    //     saveAs( imgBlob, 'collaborations.svg');
    // })

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
            // 'background-color': function(ele){if (ele.data('type')=="GroupLeader"){return "#B22"} else if (ele.data('type')=="Company"){return "#2B2"} return('#22B')},
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