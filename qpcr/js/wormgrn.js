$(document).ready(function(){

    current_network = "qPCR";
    gene_suggestions = []

    $("#search").prop("disabled",true);
    loadNetwork();

    colour_brewer = ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628","#f781bf","#999999"];

    $('#genename').autoComplete({
        resolver:'custom',
        minLength: 1,
        events: {
            search: function(qry, callback) {
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
    $("#pvalue").change(get_p_value)
    $("#rvalue").change(get_r_value)

}); 

function get_p_value () {
       var pvalue_percent = $("#pvalue").val();
       // The values run from 1 to 0.001
       var pvalue_cutoff = (((100-pvalue_percent)/100)*0.999)+0.001;

       console.log("Pvalue is "+pvalue_cutoff);

        // Set the label on the slider
        $("#curpvalue").text(pvalue_cutoff.toFixed(3))

       return(pvalue_cutoff)
}

function get_r_value () {
        // Now we can work out the rvalue cutoff from the position of the slider
        var rvalue_percent = $("#rvalue").val();
        var rvalue_cutoff = rvalue_percent/100;

        // Update the number on the slider
        $("#currvalue").text(rvalue_cutoff.toFixed(3))


        return(rvalue_cutoff);
    
}


function run_search() {

    console.log("Running search")
    // Clear any previous errors
    $("#warning").text("");

    // Make the search button inactive
    $("#search").prop("disabled",true);

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

    var rvalue_cutoff = get_r_value();
    var pvalue_cutoff = get_p_value();

    // Go through the nodes.  We need all edges mentioning
    // this search
    for (i=0;i<network_data.length;i++) {
        if (network_data[i]["group"] == "edges") {

            if (network_data[i]["data"]["absrvalue"] < rvalue_cutoff) {
                continue;
            }
            if (network_data[i]["data"]["pvalue"] > pvalue_cutoff) {
                continue;
            }

            if (network_data[i]["data"]["source"]==gene) {
                found_query = true;
                elements.push(network_data[i]);
                node_names[network_data[i]["data"]["target"]] = 1;
                node_counts++;
            }
        }
    }

    // console.log("Found "+node_counts+" for "+gene);

    if (!found_query) {
        $("#warning").text("No interactions found");
        // Empty the graph
        updateGraph([])
        // Make the search button active
        $("#search").prop("disabled",false);

        return;
    }

    if (node_counts > 150) {
        $("#warning").text("Not drawing "+gene+" as "+node_counts+" nodes found");

        // Empty the graph
        updateGraph([])
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
                if (network_data[i]["data"]["id"] == gene) {
                    network_data[i]["data"]["type"]="regulator";
                }
                else {
                    network_data[i]["data"]["type"]="target";
                }
                elements.unshift(network_data[i]);

            }
        }
    }

    updateGraph(elements);

    // Make the search button active
    $("#search").prop("disabled",false);


}

function loadNetwork () {

    // Hide all of the groups until we've seen then
    $(".colourgroup").hide();

    $.getJSON("json/"+current_network+".json", function(data) {
        console.log("Loaded "+current_network);
        gene_suggestions = []
        network_data = data;

        // We need to know the gene names
        for (i=0;i<network_data.length;i++) {
            if (network_data[i]["group"] == "nodes") {
                gene_suggestions.push(network_data[i]["data"]["id"]);
            }
        }

        gene_suggestions.sort();
        run_search();
    });
}

function updateGraph (data) {
    cy = cytoscape({

        container: document.getElementById('network'), // container to render in
        elements: data,
        
        style: [ // the stylesheet for the graph
        {
            selector: 'node',
            style: {
            'background-color': '#B22',
            'background-color': function(ele){if (ele.data('type')=="regulator"){return("red")}else{return("blue")}},
            'label': 'data(id)',
            'shape': 'ellipse'
            }
        },
        
        {
            selector: 'edge',
            style: {
                'target-arrow-shape': function(ele){if (ele.data('type')=="active"){return'triangle'}else{return 'tee'}},
                'target-arrow-color': "mapData(absrvalue,0,1,#EEE,#666)",
                'line-color': "mapData(absrvalue,0,1,#EEE,#666)",
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
        },

        wheelSensitivity: 0.01,
        
        });
}