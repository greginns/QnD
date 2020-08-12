# QnD

#### Data setup
<u>Client Side</u>                           <u>Server Side</u>
WSDataComm sets up WS with server     Wouter handles incoming WS messages
sends and receives ws messages        usually to (un)subscribe to data changes

TableStore is used to mantain data 
on the client
Handles inserts, updates, deletes.
Reacts to WS messages from server

TableView is a view to a tablestore.
It can filter and sort data.


#### Data (insert, update, etc) Flow
<u>Client Side</u>                           <u>Server Side</u>

Post to Server      ---->             Process request
                                            |
                                            |
                                            V

Process response    <----             Send response
Process message     <----             Send WS message (initiated from modelRun)
-update tablestore                    -action (+-*) and data rows
-update tableview (via proxy)