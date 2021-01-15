$(document).ready(function(){

    $("#search").prop("disabled",true);

    network = "max_aufe"
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
        var min_weight = 0;
        var mean_weight = 0;
        var edge_weight_count = 0;

        node_names[gene] = 1;

        var node_counts = 1;


        // We need to know the edge weight range.  Eventually
        // we should calculate this at the point we load the
        // data but we'll kludge it here for now.
        for (i=0;i<network_data.length;i++) {
            if (network_data[i]["group"] == "edges") {
                if (min_weight = 0 | network_data[i]["data"]["weight"] < min_weight) {
                    min_weight = network_data[i]["data"]["weight"];
                }

                mean_weight += network_data[i]["data"]["weight"];
                edge_weight_count++;
            }
        }

        mean_weight /= edge_weight_count;
        mean_weight = mean_weight*10;

        // Now we can work out the weight cutoff from the position of the slider
        var weight_percent = $("#weight").val();
        var weight_cutoff = (((mean_weight - min_weight)/100)*weight_percent)+min_weight;

        console.log("Weight cutoff is "+weight_cutoff+" from "+min_weight+" , "+mean_weight+" , "+weight_percent);

        // Go through the nodes.  We need all edges mentioning
        // this search
        for (i=0;i<network_data.length;i++) {
            if (network_data[i]["group"] == "edges") {

                if (network_data[i]["data"]["weight"] < weight_cutoff) {
                    continue;
                }

                if (network_data[i]["data"]["source"]==gene) {
                    elements.push(network_data[i]);
                    node_names[network_data[i]["data"]["target"]] = 1;
                    node_counts++;
                }
                else if (network_data[i]["data"]["target"]==gene) {
                    elements.push(network_data[i]);
                    node_names[network_data[i]["data"]["source"]] = 1;
                    node_counts++;
                }
            }
        }

        if (node_counts > 100) {
            // TODO: Put up an error
            console.log("Not drawing "+gene+" as "+node_counts+" nodes found");
            return;
        }


        // Now do a second pass looking for the nodes we need and any additional
        // edges amongst the additional nodes.
        for (i=0;i<network_data.length;i++) {

            if (network_data[i]["group"] == "edges" & !(network_data[i]["data"]["source"] == gene | network_data[i]["data"]["target"]=="gene")) {
                if (network_data[i]["data"]["source"] in node_names & network_data[i]["data"]["target"] in node_names) {
                    elements.push(network_data[i]);
                }
            }

            if (network_data[i]["group"] == "nodes") {
                if (network_data[i]["data"]["id"] in node_names) {
                    elements.unshift(network_data[i]);
                }
            }
        }

        updateGraph(elements, min_weight, mean_weight);

    });

}); 

function updateGraph (data, min_weight, max_weight) {
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
            'target-arrow-shape': function(ele){if (ele.data('type')=="active"){return 'triangle'}else{return 'tee'}},
                // 'width': "mapData(weight,1,"+maxWeight+",1,10)",
            'line-color': "mapData(weight,"+min_weight+","+max_weight+",#CCC,#222)",
            'curve-style': 'bezier'
            }
        }
        ],
        
        layout: {
            name: "cose-bilkent",
            randomize: true,
            animate: false, 
            idealEdgeLength: 250,
            nodeRepulsion: 2048
        }
        
        });
}