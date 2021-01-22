# Gene Regulatory Networks from *C. elegans*

This repository contains the code for the interactive network viewer for the networks from the paper:

>Suriyalaksh et al (2021): Gene Regulatory Network inference in long lived C.elegans reveals modular properties that are predictive of novel ageing genes

There are two different network views enabled by this code

```/qpcr/``` available [here](https://s-andrews.github.io/wormgrn/qpcr/) shows the network from the high throughput qPCR validation of the initial targets.  Nodes are genes and edges are interactions and are annotated by both a correlation value to show the relative quantitative effect of the gene knockdown on each target, and a corrected p-value to show the significance of the interaction.

```/grn/``` available [here](https://s-andrews.github.io/wormgrn/grn/) hows the three different inferred gene regulatory networks from the initial phase of the study.  These are larger, more noisy, networks built from high throughput gene expression data, and formed the basis for the selection of regulators and targets to test in the qPCR network.

If you have any problems with using this viewer please report them using the "issues" link above.
