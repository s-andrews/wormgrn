import glob
import json

def main():
    groups = read_groups()

    network_files = glob.glob("raw_data/*_network.txt")

    for nf in network_files:
        print(f"Reading network {nf}")
        process_network(nf,groups)



def process_network (network_file, groups):
    network_name = network_file.split("\\")[-1].replace("_network.txt","")

    print(f"Name is {network_name}")

    nodes = {}
    edges = []

    with open(network_file) as nf:
        nf.readline() # header

        edge_number = 0
        for line in nf:
            (fromGene,toGene,weight) = line.strip().split("\t")

            if not fromGene in groups[network_name]:
                print(f"Didn't find {fromGene} in groups for {network_name}")
                continue

            if not toGene in groups[network_name]:
                print(f"Didn't find {toGene} in groups for {network_name}")
                continue

            if not fromGene in nodes:
                nodes[fromGene] = {"group":"nodes","data":{"id":fromGene, "group":groups[network_name][fromGene]}}
            if not toGene in nodes:
                nodes[toGene] = {"group":"nodes","data":{"id":toGene, "group":groups[network_name][toGene]}}

            edges.append({
                "group":"edges",
                "data":{
                    "id":f"e{edge_number}",
                    "source":fromGene, 
                    "target":toGene, 
                    "weight":abs(float(weight)), 
                    "type":"active" if float(weight)>0 else "repressive"
                    }})

    elements = []

    for n in nodes:
        elements.append(nodes[n])

    for e in edges:
        elements.append(e)


    with open(f"json/{network_name}.json","w") as jfile:
        json.dump(elements,jfile)




def read_groups():

    groups = {}

    with open("raw_data/gene_groups.txt") as file:
        for line in file:
            (network,gene,group) = line.strip().split("\t")
            gene = gene.strip()

            if not network in groups:
                groups[network] = {}

            if gene in groups[network]:
                print(f"Already found {gene} in {network}")
            groups[network][gene] = group

        return groups


if __name__ == "__main__":
    main()