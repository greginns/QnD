# QnD

#### Data setup
<table>
<thead>
<tr>
<th>Client Side</th>
<th>Server Side</th>
</tr>
</thead>
<tbody>

<tr>
<td>
WSDataComm sets up WS with server
sends and receives ws messages
</td>
<td>
Wouter handles incoming WS messages
usually to (un)subscribe to data changes
</td>
</tr>

<tr>
<td>
TableStore is used to mantain data 
on the client
Handles inserts, updates, deletes.
Reacts to WS messages from server
</td>
<td>
</td>
</tr>

<tr>
<td>
TableView is a view to a tablestore.
It can filter and sort data.
</td>
<td>
</td>
</tr>

<tr>
<td>
Post to Server      ---->
</td>
<td>
Process request
</td>
</tr>

<tr>
<td>
</td>
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
Send response
</td>
</tr>

<tr>
<td>
Process message
-update tablestore
-update tableview (via proxy)
</td>
<td>
Send WS message (initiated from modelRun)
-action (+-*) and data rows
</td>
</tr>

<tr>
<td>
</td>
<td>
</td>
</tr>

</tbody>
</table>