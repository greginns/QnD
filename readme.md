# QnD

#### App/Page setup
App
  - may have 1+ modules
  - may have 1+ versions
  
Module 
- js - sets up data common to all pages
- html - includes pages and helpers

Pages 
- js - page logic, subclasses mvc
- html - page layout includes 1+ sections 

Sections
- each section requires an mvc

#### Data setup
<table>
<thead>
<tr>
<th>Client Side</th>
<th></th>
<th>Server Side</th>
</tr>
</thead>
<tbody>

<tr>
<td>
<b>WSDataComm</b> sets up WS with server<br>
sends and receives ws messages
</td>
<td></td>
<td>
<b>Wouter</b> handles incoming WS messages
usually to (un)subscribe to data changes
</td>
</tr>

<tr>
<td>
<b>TableStore</b> is used to mantain data 
on the client<br>
Handles inserts, updates, deletes.
Reacts to WS messages from server
</td>
<td></td>
<td>
</td>
</tr>

<tr>
<td>
<b>TableView</b> is a view to a tablestore.<br>
It can filter and sort data.
</td>
<td>
<td></td>
</td>
</tr>

<tr>
<td>
Post/Put/Delete      
</td>
<td>
---->
</td>
<td>
Process request
</td>
</tr>

<tr>
<td>
</td>
<td></td>
<td>
|<br>
|<br>
V
</td>
</tr>

<tr>
<td>
Process response     
</td>
<td>
<----
</td>
<td>
Send response
</td>
</tr>

<tr>
<td>
Process message<br>
-update tablestore<br>
-update tableview (via proxy)
</td>
<td>
<----
</td>
<td>
Send WS message (initiated from <b>Model</b>)<br>
-action (+-*) and data rows
</td>
</tr>

<tr>
<td>
</td>
<td></td>
<td>
</td>
</tr>

</tbody>
</table>