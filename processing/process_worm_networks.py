import glob
import json

def main():
    groups = read_groups()

    network_files = glob.glob("raw_data/*_network.txt")

    for nf in network_files:
        print("NF="+nf)
        # We do different processing to the qPCR network
        if nf == "raw_data\\qPCR_network.txt":
            process_qpcr_network(nf)
            continue

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
            (fromGene,toGene,weight) = line.strip().split(" ")

            if not fromGene in groups[network_name]:
                # qPCR doesn't have groups
                if network_name == 'qPCR':
                    groups[network_name][fromGene] = 0
                else:
                    print(f"Didn't find {fromGene} in groups for {network_name}")
                    continue

            if not toGene in groups[network_name]:
                # qPCR doesn't have groups
                if network_name == 'qPCR':
                    groups[network_name][toGene] = 0
                else:
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

            edge_number += 1

    elements = []

    for n in nodes:
        elements.append(nodes[n])

    for e in edges:
        elements.append(e)


    with open(f"www/json/{network_name}.json","w") as jfile:
        json.dump(elements,jfile)



def process_qpcr_network (network_file):
    network_name = network_file.split("\\")[-1].replace("_network.txt","")

    print(f"qPCR name is {network_name}")

    nodes = {}
    edges = []

    with open(network_file) as nf:
        nf.readline() # header

        edge_number = 0
        for line in nf:
            sections = line.strip().split("\t")
            regulator = sections[0]
            target = sections[1]
            if sections[2].startswith("<"):
                rvalue = 0.001
            else:
                rvalue = float(sections[2])
            if sections[3].startswith("<"):
                pvalue = 0.001
            else:
                pvalue = float(sections[3])


            if not regulator in nodes:
                nodes[regulator] = {"group":"nodes","data":{"id":regulator, "group":"regulator"}}

            if not target in nodes:
                nodes[target] = {"group":"nodes","data":{"id":target, "group":"target"}}

            edges.append({
                "group":"edges",
                "data":{
                    "id":f"e{edge_number}",
                    "source":regulator, 
                    "target":target, 
                    "rvalue":rvalue,
                    "absrvalue":abs(rvalue), 
                    "pvalue":pvalue,
                    "type":"active" if float(rvalue)>0 else "repressive"
                    }})

            edge_number += 1

    elements = []

    for n in nodes:
        elements.append(nodes[n])

    for e in edges:
        elements.append(e)


    with open(f"qpcr/json/{network_name}.json","w") as jfile:
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