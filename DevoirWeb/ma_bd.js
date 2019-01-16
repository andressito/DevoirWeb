var mysql = require('mysql');

var con = mysql.createConnection({
  host: "A_COMPLETER",
  user: "A_COMPLETER",
  password: "A_COMPLETER",
  database: "A_COMPLETER"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  var sqlClient = "CREATE TABLE Client(ClientID int NOT NULL AUTO_INCREMENT,login varchar(255) NOT NULL,password varchar(255) NOT NULL,prenom varchar(255),nom varchar(255),email varchar(255),numero varchar(255),PRIMARY KEY (ClientID))";
  var sqlChauffeur="CREATE TABLE Chauffeur(ChauffeurID int NOT NULL AUTO_INCREMENT,login varchar(255) NOT NULL,password varchar(255) NOT NULL,prenom varchar(255),nom varchar(255),disponible int NOT NULL,email varchar(255),numero varchar(255),PRIMARY KEY (ChauffeurID))";
  var sqlCourse="CREATE TABLE Course(CourseID int NOT NULL AUTO_INCREMENT,lieu_depart varchar(255) NOT NULL,lieu_darrivee varchar(255) NOT NULL,date datetime NOT NULL,status varchar(255) NOT NULL,ClientID int NOT NULL,VoitureID int NOT NULL,PRIMARY KEY (CourseID),FOREIGN KEY(ClientID) REFERENCES Client(ClientID),FOREIGN KEY (VoitureID) REFERENCES Voiture(VoitureID))";
  var sqlVoiture="CREATE TABLE Voiture(VoitureID int NOT NULL AUTO_INCREMENT,marque varchar(255) NOT NULL,modele varchar(255) NOT NULL,couleur varchar(255) NOT NULL,disponible int NOT NULL,ChauffeurID int NOT NULL,PRIMARY KEY (VoitureID),FOREIGN KEY (ChauffeurID) REFERENCES Chauffeur(ChauffeurID))";
  con.query(sqlClient, function (err, result) {
    if (err) throw err;
    console.log("Table client created");
  });
  con.query(sqlChauffeur, function (err, result) {
    if (err) throw err;
    console.log("Table chauffeur created");
  });
  con.query(sqlVoiture, function (err, result) {
    if (err) throw err;
    console.log("Table voiture created");
  });
  con.query(sqlCourse, function (err, result) {
    if (err) throw err;
    console.log("Table course created");
  });
});
