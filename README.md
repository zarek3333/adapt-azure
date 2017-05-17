adapt-azure
================

Component that allows the Azure to be used within Adapt. 

ADD THE CODE BELOW TO YOUR THEME FOR THIS COMPONENT TO WORK
 $( "script#azurejs" ).remove();
 $( "head" ).append("<script id=\"azurejs\" src=\"https://amp.azure.net/libs/amp/1.7.4/azuremediaplayer.min.js\"></script>");

 $( "link#azurecss" ).remove();
 $( "head" ).append("<link rel=\"stylesheet\" id=\"azurecss\" href=\"https://amp.azure.net/libs/amp/1.7.4/skins/amp-default/azuremediaplayer.min.css\">");

ISSUES: Can't track the progress of a video yet.
