$(document).ready(function(){

    current_network = "max_aufe";
    min_weight = 0;
    mean_weight = 0;

    $("#search").prop("disabled",true);
    loadNetwork();

    colour_brewer = ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628","#f781bf","#999999"];

    gene_suggestions = []

    $('#genename').autoComplete({
        resolver:'custom',
        minLength: 1,
        events: {
            search: function(qry, callback) {
                console.log("Autocomplete running for "+qry);
                suggestions = []
                for (i in gene_suggestions) {
                    var thisName = gene_suggestions[i]
                    if (thisName.toLowerCase().indexOf(qry.toLowerCase()) > -1) {
                        suggestions.push(thisName)
                        if (suggestions.length==100) {
                            break;
                        }
                    }
                }
                callback(suggestions)
            }
        }
    });


    // Make the graph export work
    // $('#export').click(function() {
    //     var imgBlob = new Blob([cy.svg()], {type: 'image/svg+xml'});

    //     saveAs( imgBlob, 'collaborations.svg');
    // })


    $("#search").click(run_search);

}); 

function run_search() {

    // Clear any previous errors
    $("#warning").text("");

    // Make the search button inactive
    $("#search").prop("disabled",true);

    // See if we need to update the loaded network
    var selected_network = $("#nettype").val();

    if (selected_network != current_network) {
        current_network = selected_network;
        loadNetwork();
        return;
    }

    // Get the gene name from the search
    var gene = $("#genename").val()
    // console.log("Search term is "+gene);


    if (gene.length==0) {
        $("#search").prop("disabled",false);
        return;
    }

    var elements = [];
    var node_names = {};

    node_names[gene] = 1;

    var node_counts = 1;
    var found_query = false;

    // Now we can work out the weight cutoff from the position of the slider
    var weight_percent = $("#weight").val();
    var weight_cutoff = (((mean_weight - min_weight)/100)*weight_percent)+min_weight;

    // console.log("Weight cutoff is "+weight_cutoff+" from "+min_weight+" , "+mean_weight+" , "+weight_percent);

    // Go through the nodes.  We need all edges mentioning
    // this search
    for (i=0;i<network_data.length;i++) {
        if (network_data[i]["group"] == "edges") {

            if (network_data[i]["data"]["weight"] < weight_cutoff) {
                continue;
            }

            if (network_data[i]["data"]["source"]==gene) {
                found_query = true;
                elements.push(network_data[i]);
                node_names[network_data[i]["data"]["target"]] = 1;
                node_counts++;
            }
            else if (network_data[i]["data"]["target"]==gene) {
                found_query = true;
                elements.push(network_data[i]);
                node_names[network_data[i]["data"]["source"]] = 1;
                node_counts++;
            }
        }
    }

    // console.log("Found "+node_counts+" for "+gene);

    if (!found_query) {
        $("#warning").text("No interactions found");
        // Make the search button active
        $("#search").prop("disabled",false);

        return;
    }

    if (node_counts > 100) {
        $("#warning").text("Not drawing "+gene+" as "+node_counts+" nodes found");
        // Make the search button active
        $("#search").prop("disabled",false);
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

    // Make the search button active
    $("#search").prop("disabled",false);


}

function loadNetwork () {


    // Hide all of the groups until we've seen then
    var seen_groups = {}
    $(".colourgroup").hide();

    $.getJSON("json/"+current_network+".json", function(data) {
        // console.log("Loaded "+current_network);
        gene_suggestions = []
        network_data = data;
        var edge_weight_count = 0;

        // We need to know the edge weight range.  
        // console.log("Iterating through elements")
        for (i=0;i<network_data.length;i++) {
            if (network_data[i]["group"] == "edges") {
                if (min_weight = 0 | network_data[i]["data"]["weight"] < min_weight) {
                    min_weight = network_data[i]["data"]["weight"];
                }

                mean_weight += network_data[i]["data"]["weight"];
                edge_weight_count++;
            }
            else {
                // It's a node
                gene_suggestions.push(network_data[i]["data"]["id"]);
                // Check to see if we need to enable a group
                var group_number = network_data[i]["data"]["group"]
                if (! (group_number in seen_groups)) {
                    $('#group'+group_number).show();
                    seen_groups[group_number] = 1
                }
            }
        }

        gene_suggestions.sort();

        mean_weight /= edge_weight_count;

        mean_weight = mean_weight*10;


        // For the qPCR network we are using correlation values
        // so we'll just hard code from 0-1
        if (current_network == "qPCR") {
            min_weight = 0
            mean_weight = 1
        }

        run_search();

    });
}

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