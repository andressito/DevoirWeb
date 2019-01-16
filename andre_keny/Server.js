var express= require('express');
var mysql=require('mysql');
var md5= require('md5');
var bodyParser = require('body-parser');
var session=require('express-session');
var app = express();
var time = require('time');
var fs=require('fs');
app.set('view engine', 'ejs');
var dateFormat= require('dateformat');

//variable de connexion à la BD
var con = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "123456",
  database: "SENCAB"
});

con.connect(function(err){
	if(err) throw err;
	console.log('DB connected');
});



app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true,
	cookie: { maxAge:24 * 60 * 60 * 1000}
}));


//index page
app.get('/',function(req,res){
	var mess='';
	res.render('pages/index',{mess:mess});
});

//  <<<<===== PARTIE   CHAUFFEUR  =====>>>>>

//renseigner une voiture
app.get('/chauffeur/profil/voiture',function(req,res){
	var chauffeur =  req.session.chauffeur;
 	var chauffeurId = req.session.chauffeurId;
 	var mess;
 	if(chauffeurId==null){
 		res.redirect('/');
 	}else{
 		con.query('select * from Voiture where ChauffeurID="'+chauffeurId+'"',function(err,result){
 			if(result.length==0){
 				mess="Renseignez votre voiture SVP!";
 				res.render('pages/chauffeur/voiture.ejs',{chauffeur:chauffeur,mess:mess,voiture:null});
 			}else{
 				mess="Votre Voiture!";
 				res.render('pages/chauffeur/voiture.ejs',{chauffeur:chauffeur,mess:mess,voiture:result[0]})
 			}
 		});
 	}

});

app.post('/ajoutervoiture',function(req,res){
	var chauffeur =  req.session.chauffeur;
 	var chauffeurId = req.session.chauffeurId;
 	var disponible=1;
 	status="prise en charge";
 	if(chauffeurId==null){
 		res.redirect('/');
 	}else{
 		con.query('insert into Voiture (marque,modele,couleur,disponible,ChauffeurID) values ("'+req.body.marque+'","'+req.body.modele+'","'+req.body.couleur+'","'+disponible+'","'+chauffeurId+'")',function(err,result){
 			if (err) throw err;
 			var mess="Ajout réussi!";
 			res.render('pages/chauffeur/profil.ejs',{chauffeur:chauffeur,mess:mess});
 		});
 	}
});

//chauffeur page
app.get('/chauffeur',function(req,res){
	var chauffeur =  req.session.chauffeur;
 	var chauffeurId = req.session.chauffeurId;
 	var statusAPC="attente prise en charge";
 	var statusPC="prise en charge";
 	var statusAPD="arrivée point départ";
 	var statusEN="en cours";
 	var mess;
 	if(chauffeurId==null){
 		res.redirect('/');
 	}else{
 		con.query('select * from Voiture where ChauffeurID="'+chauffeurId+'"',function(err,result){
 			if(result.length==0){
 				mess="Renseignez votre voiture SVP!";
 				res.render('pages/chauffeur/voiture.ejs',{chauffeur:chauffeur,mess:mess,voiture:null});
 			}else{
 				var voitureID=result[0].VoitureID;
	 			con.query('select * from Course where status="'+statusAPC+'"and VoitureID="'+voitureID+'"',function(err,result){
	 				if(result.length==0){
	 					con.query('select * from Course where status="'+statusPC+'"and VoitureID="'+voitureID+'"',function(err,result){
	 						if(result.length==0){
	 							con.query('select * from Course where status="'+statusAPD+'"and VoitureID="'+voitureID+'"',function(err,result){
	 								if(result.length==0){
	 									con.query('select * from Course where status="'+statusEN+'"and VoitureID="'+voitureID+'"',function(err,result){
	 										if(result.length==0){
	 											mess="vous n'avez pas de course!";
	 											res.render('pages/chauffeur/chauffeur.ejs',{chauffeur:chauffeur,mess:mess,courseAPC:null,coursePC:null,courseAPD:null,courseEN:null});
	 										}else{
	 											mess="vous avez une course en cours!";
	 											res.render('pages/chauffeur/chauffeur.ejs',{chauffeur:chauffeur,mess:mess,courseAPC:null,coursePC:null,courseAPD:null,courseEN:result[0]});
	 										}
	 									});
	 								}else{
	 									mess="Vous etes arrivé au point de départ, démarrez la course!";
	 									res.render('pages/chauffeur/chauffeur.ejs',{chauffeur:chauffeur,mess:mess,courseAPC:null,coursePC:null,courseAPD:result[0],courseEN:null});
	 								}
	 							});
	 						}else{
	 							mess="Vous avez une course prise en charge, prevenez votre client des que vous arrivez au point de rdv!!";
	 							res.render('pages/chauffeur/chauffeur.ejs',{chauffeur:chauffeur,mess:mess,courseAPC:null,coursePC:result[0],courseAPD:null,courseEN:null});
	 						}
	 					});
	 				}else{
	 					mess="Vous avez une course en attente de prise en charge!";
	 					res.render('pages/chauffeur/chauffeur.ejs',{chauffeur:chauffeur,mess:mess,courseAPC:result[0],coursePC:null,courseAPD:null,courseEN:null});
	 				}
	 			});
 			}
 		});
 	}
});

//prendre en charge une course
app.post('/prendreCharge',function(req,res){
	var chauffeur =  req.session.chauffeur;
 	var chauffeurId = req.session.chauffeurId;
 	status="prise en charge";
 	if(chauffeurId==null){
 		res.redirect('/');
 	}else{
 		con.query('select * from Course where CourseID="'+req.body.course+'"',function(err,result){
 			var voitureID=result[0].VoitureID;
 			con.query('update Course set status="'+status+'" where CourseID= "'+req.body.course+'"',function(err,result){
 				con.query('update Voiture set disponible = 0 where VoitureID= "'+voitureID+'"',function(err,result){});
		 				mess="Vous avez pris en charge la course!";
		 				res.render('pages/chauffeur/chauffeur.ejs',{chauffeur:chauffeur,mess:mess,courseAPC:null,coursePC:null,courseAPD:null,courseEN:null});
 			});
 		});
 	}
});

//arrivée au point de destination
app.post('/arriveePD',function(req,res){
	var chauffeur =  req.session.chauffeur;
 	var chauffeurId = req.session.chauffeurId;
 	status="arrivée point départ";
 	if(chauffeurId==null){
 		res.redirect('/');
 	}else{
 		con.query('select * from Course where CourseID="'+req.body.course+'"',function(err,result){
 			var voitureID=result[0].VoitureID;
 			con.query('update Course set status="'+status+'" where CourseID= "'+req.body.course+'"',function(err,result){
		 				mess="Vous êtes arrivé au point de départ!";
		 				res.render('pages/chauffeur/chauffeur.ejs',{chauffeur:chauffeur,mess:mess,courseAPC:null,coursePC:null,courseAPD:null,courseEN:null});
 			});
 		});
 	}
});


//demarrer une course
app.post('/demarrer',function(req,res){
	var chauffeur =  req.session.chauffeur;
 	var chauffeurId = req.session.chauffeurId;
 	status="en cours";
 	if(chauffeurId==null){
 		res.redirect('/');
 	}else{
 		con.query('select * from Course where CourseID="'+req.body.course+'"',function(err,result){
 			var voitureID=result[0].VoitureID;
 			con.query('update Course set status="'+status+'" where CourseID= "'+req.body.course+'"',function(err,result){
 				con.query('update Voiture set disponible = 0 where VoitureID= "'+voitureID+'"',function(err,result){});
		 				mess="Vous avez démarré la couse!";
		 				res.render('pages/chauffeur/chauffeur.ejs',{chauffeur:chauffeur,mess:mess,courseAPC:null,coursePC:null,courseAPD:null,courseEN:null});
 			});
 		});
 	}
});

//terminer une course
app.post('/terminer',function(req,res){
	var chauffeur =  req.session.chauffeur;
 	var chauffeurId = req.session.chauffeurId;
 	status="terminée";
 	if(chauffeurId==null){
 		res.redirect('/');
 	}else{
 		con.query('select * from Course where CourseID="'+req.body.course+'"',function(err,result){
 			var voitureID=result[0].VoitureID;
 			con.query('update Course set status="'+status+'" where CourseID= "'+req.body.course+'"',function(err,result){
 				con.query('update Voiture set disponible = 1 where VoitureID= "'+voitureID+'"',function(err,result){});
		 				mess="Vous avez terminé la course!";
		 				res.render('pages/chauffeur/chauffeur.ejs',{chauffeur:chauffeur,mess:mess,courseAPC:null,coursePC:null,courseAPD:null,courseEN:null});
 			});
 		});
	}
});

//pages courses
app.get('/chauffeur/courses',function(req,res){
	var chauffeur =  req.session.chauffeur;
 	var chauffeurId = req.session.chauffeurId;
 	if(chauffeurId==null){
 		res.redirect('/');
 	}else{
 		var mess="";
 		res.render('pages/chauffeur/courses.ejs',{chauffeur:chauffeur,mess:mess,course:null});
 	}
 	
});

app.get('/chauffeur/courses/avenir',function(req,res){
	var chauffeur =  req.session.chauffeur;
 	var chauffeurId = req.session.chauffeurId;
 	status1="à venir";
 	if(chauffeurId==null){
 		res.redirect('/');
 	}else{
 		con.query('select * from Voiture where ChauffeurID="'+chauffeurId+'"',function(err,result){
	 		if(result.length==0){
	 			mess="Renseignez votre voiture SVP!";
 				res.render('pages/chauffeur/voiture.ejs',{chauffeur:chauffeur,mess:mess,voiture:null});
	 		}else{
	 			var voitureID=result[0].VoitureID;
		 		con.query('select * from Course where status="'+status1+'" and VoitureID="'+voitureID+'"',function(err,result){
		 			if(result.length==0){
		 				mess="Courses à venir";
		 				res.render('pages/chauffeur/avenir.ejs',{chauffeur:chauffeur,mess:mess,course:null});
		 			}else{
		 				mess="Courses à venir";
		 				res.render('pages/chauffeur/avenir.ejs',{chauffeur:chauffeur,mess:mess,course:result});
		 			}
		 		});
	 		}
 		});
 	}
});

app.get('/chauffeur/courses/encours',function(req,res){
	var chauffeur =  req.session.chauffeur;
 	var chauffeurId = req.session.chauffeurId;
 	status1="en cours";
 	if(chauffeurId==null){
 		res.redirect('/');
 	}else{
 		con.query('select * from Voiture where ChauffeurID="'+chauffeurId+'"',function(err,result){
	 		if(result.length==0){
	 			mess="Renseignez votre voiture SVP!";
 				res.render('pages/chauffeur/voiture.ejs',{chauffeur:chauffeur,mess:mess,voiture:null});
	 		}else{
	 			var voitureID=result[0].VoitureID;
		 		con.query('select * from Course where status="'+status1+'" and VoitureID="'+voitureID+'"',function(err,result){
		 			if(result.length==0){
		 				mess="Courses en cours";
		 				res.render('pages/chauffeur/encours.ejs',{chauffeur:chauffeur,mess:mess,course:null});
		 			}else{
		 				mess="Courses en cours";
		 				res.render('pages/chauffeur/encours.ejs',{chauffeur:chauffeur,mess:mess,course:result[0]});
		 			}
		 		});
	 		}
 		});
 	}
});

app.get('/chauffeur/courses/terminees',function(req,res){
	var chauffeur =  req.session.chauffeur;
 	var chauffeurId = req.session.chauffeurId;
 	status1="terminée";
 	if(chauffeurId==null){
 		res.redirect('/');
 	}else{
 		con.query('select * from Voiture where ChauffeurID="'+chauffeurId+'"',function(err,result){
	 		if(result.length==0){
	 			mess="Renseignez votre voiture SVP!";
 				res.render('pages/chauffeur/voiture.ejs',{chauffeur:chauffeur,mess:mess,voiture:null});
	 		}else{
	 			var voitureID=result[0].VoitureID;
		 		con.query('select * from Course where status="'+status1+'" and VoitureID="'+voitureID+'"',function(err,result){
		 			if(result.length==0){
		 				mess="Courses Terminées";
		 				res.render('pages/chauffeur/terminees.ejs',{chauffeur:chauffeur,mess:mess,course:null});
		 			}else{
		 				mess="Courses Terminées";
		 				res.render('pages/chauffeur/terminees.ejs',{chauffeur:chauffeur,mess:mess,course:result});
		 			}
		 		});
	 		}
 		});
 	}
});


//profil chauffeur
app.get('/chauffeur/profil',function(req,res){
	var chauffeur =  req.session.chauffeur;
 	var chauffeurId = req.session.chauffeurId;
 	var mess;
 	if(chauffeurId==null){
 		res.redirect('/');
 	}else{
 		mess="";
 		res.render('pages/chauffeur/profil.ejs',{chauffeur:chauffeur,mess:mess});
 	}
 	
 	
});

app.get('/chauffeur/profil/infos',function(req,res){
	var chauffeur =  req.session.chauffeur;
 	var chauffeurId = req.session.chauffeurId;
 	var mess;
 	if(chauffeurId==null){
 		res.redirect('/');
 	}else{
 		con.query('select * from Chauffeur WHERE ChauffeurID= "'+chauffeurId+'"',function(err,result){
 			mess="Mes infos";
 			res.render('pages/chauffeur/mesinfos.ejs',{chauffeur:result[0],mess:mess});
 		});
 	}
});

app.get('/chauffeur/profil/modification',function(req,res){
	var chauffeur =  req.session.chauffeur;
 	var chauffeurId = req.session.chauffeurId;
 	var mess;
 	if(chauffeurId==null){
 		res.redirect('/');
 	}else{
 		mess="Modifier mes informations";
 		res.render('pages/chauffeur/modif.ejs',{chauffeur:chauffeur,mess:mess});
 	}
});

//modifier chauffeur
app.post('/chauffeur/modifier',function(req,res){
	var chauffeur =  req.session.chauffeur;
 	var chauffeurId = req.session.chauffeurId;
 	var mess;
 	if(chauffeurId==null){
 		res.redirect('/');
 	}else{
 		if(req.body.prenom.length!=0){
 			con.query('update Chauffeur set prenom = "'+req.body.prenom+'" where ChauffeurID= "'+chauffeurId+'"',function(err,result){});
 		}
 		if(req.body.nom.length!=0){
 			con.query('update Chauffeur set nom = "'+req.body.nom+'" where ChauffeurID= "'+chauffeurId+'"',function(err,result){});
 		}
 		if(req.body.email.length!=0){
 			con.query('update Chauffeur set email = "'+req.body.email+'" where ChauffeurID= "'+chauffeurId+'"',function(err,result){});
 		}
 		if(req.body.numero.length!=0){
 			con.query('update Chauffeur set numero = "'+req.body.numero+'" where ChauffeurID= "'+chauffeurId+'"',function(err,result){});
 		}
 		var mess="Profil modifié";
 		res.render('pages/chauffeur/profil.ejs',{chauffeur:chauffeur,mess:mess});
 	}
});

//page de deconnexion
app.get('/logout',function(req,res){
	req.session.destroy(function(err) {
		var mess='';
  		res.render('pages/index',{mess:mess});
	});
});


//action register
app.post('/register',function(req,res){
	var sess=req.session;
	if(req.body.password== req.body.password2){
		if(req.body.user=='chauffeur'){
			con.query('select * from Chauffeur WHERE login= "'+req.body.login+'"',function(err,result){
				if(result.length==0){
					con.query('insert into Chauffeur (login, password,disponible) values ("'+req.body.login+'","'+md5(req.body.password)+'",1)',function(err,result){
						if(err) throw err;
						var mess='inscription réussi, veuillez vous connectez svp...';
						res.render('pages/index',{mess:mess});
					});
				}else{
					var mess='Login deja pris!';
					res.render('pages/index',{mess:mess});
				}
			});
		}else{
			con.query('select * from Client WHERE login= "'+req.body.login+'"',function(err,result){
				if(result.length==0){
					con.query('insert into Client (login, password) values ("'+req.body.login+'","'+md5(req.body.password)+'")',function(err,result){
						if(err) throw err;
						var mess='inscription réussi, veuillez vous connectez svp...';
						res.render('pages/index',{mess:mess});
					});
				}else{
					var mess='Login deja pris!';
					res.render('pages/index',{mess:mess});
				}
			});
		}
	}else{
		var mess="les deux mots de passe doivent être les mêmes!";
		res.render('pages/index',{mess:mess});
	}
});

//action login
app.post('/login',function(req,res){
	var sess=req.session;
	var disponibilite=1;
	var mess;
	var statusAPC="attente prise en charge";
 	var statusPC="prise en charge";
 	var statusAPD="arrivée point départ";
 	var statusEN="en cours";
	if(req.body.user=='chauffeur'){
		con.query('select * from Chauffeur WHERE login= "'+req.body.login+'" and password= "'+md5(req.body.password)+'"',function(err,result){
			if(result.length==0){
				mess='login ou mot de passe incorrect!';
				res.render('pages/index',{mess:mess});
			}else{
				req.session.chauffeurId=result[0].ChauffeurID;
				req.session.chauffeur=result[0];
				con.query('select * from Voiture where ChauffeurID="'+req.session.chauffeurId+'"',function(err,result){
					if(result.length==0){
						mess="Renseignez votre voiture SVP!";
 						res.render('pages/chauffeur/voiture.ejs',{chauffeur:req.session.chauffeur,mess:mess,voiture:null});
					}else{
				 		var voitureID=result[0].VoitureID;
				 		con.query('select * from Course where status="'+statusAPC+'"and VoitureID="'+voitureID+'"',function(err,result){
			 				if(result.length==0){
			 					con.query('select * from Course where status="'+statusPC+'"and VoitureID="'+voitureID+'"',function(err,result){
			 						if(result.length==0){
			 							con.query('select * from Course where status="'+statusAPD+'"and VoitureID="'+voitureID+'"',function(err,result){
			 								if(result.length==0){
			 									con.query('select * from Course where status="'+statusEN+'"and VoitureID="'+voitureID+'"',function(err,result){
			 										if(result.length==0){
			 											mess="vous n'avez pas de course!";
			 											res.render('pages/chauffeur/chauffeur.ejs',{chauffeur:req.session.chauffeur,mess:mess,courseAPC:null,coursePC:null,courseAPD:null,courseEN:null});
			 										}else{
			 											mess="vous avez une course en cours!";
			 											res.render('pages/chauffeur/chauffeur.ejs',{chauffeur:req.session.chauffeur,mess:mess,courseAPC:null,coursePC:null,courseAPD:null,courseEN:result[0]});
			 										}
			 									});
			 								}else{
			 									mess="Vous etes arrivé au point de départ, démarrez la course!";
			 									res.render('pages/chauffeur/chauffeur.ejs',{chauffeur:req.session.chauffeur,mess:mess,courseAPC:null,coursePC:null,courseAPD:result[0],courseEN:null});
			 								}
			 							});
			 						}else{
			 							mess="Vous avez une course prise en charge,prevenez votre client des que vous arrivez au point de rdv!";
			 							res.render('pages/chauffeur/chauffeur.ejs',{chauffeur:req.session.chauffeur,mess:mess,courseAPC:null,coursePC:result[0],courseAPD:null,courseEN:null});
			 						}
			 					});
			 				}else{
			 					mess="Vous avez une course en attente de prise en charge!";
			 					res.render('pages/chauffeur/chauffeur.ejs',{chauffeur:req.session.chauffeur,mess:mess,courseAPC:result[0],coursePC:null,courseAPD:null,courseEN:null});
			 				}
			 			});
			 		}
			 	});
			}
		});
	}else{
		con.query('select * from Client WHERE login= "'+req.body.login+'" and password= "'+md5(req.body.password)+'"',function(err,result){
			if(result.length==0){
				var mess='login ou mot de passe incorrect!';
				res.render('pages/index',{mess:mess});
			}else{
				req.session.clientId=result[0].ClientID;
				req.session.client=result[0];
				fs.readFile('public/testAdresse.txt', function(err, data){
 					var adresse=data.toString('utf-8').split(";");
					con.query('select * from Course where status="'+statusPC+'"and ClientID="'+req.session.clientId+'"',function(err,result){
			 			if(result.length==0){
			 				con.query('select * from Course where status="'+statusAPD+'"and ClientID="'+req.session.clientId+'"',function(err,result){
			 					if(result.length==0){
			 						mess="";
					 				con.query('select * from Voiture WHERE disponible= "'+disponibilite+'"',function(err,result){
								 		if(result.length==0){
								 			con.query('select * from Voiture',function(err,result){
												mess="";
												res.render('pages/client/client.ejs',{client:req.session.client,mess:mess,voitureRI:null,voitureRP:result,adresse:adresse});
								 			});
								 		}else{
								 			voitureRI=result;
								 			con.query('select * from Voiture',function(err,result){
												mess="";
												res.render('pages/client/client.ejs',{client:req.session.client,mess:mess,voitureRI:voitureRI,voitureRP:result,adresse:adresse});
								 			});
								 		}
							 		});
			 					}else{
			 						mess="Votre chauffeur est sur le lieu de rendez-vous!";
					 				con.query('select * from Voiture WHERE disponible= "'+disponibilite+'"',function(err,result){
								 		if(result.length==0){
								 			con.query('select * from Voiture',function(err,result){
												mess="";
												res.render('pages/client/client.ejs',{client:req.session.client,mess:mess,voitureRI:null,voitureRP:result,adresse:adresse});
								 			});
								 		}else{
								 			voitureRI=result;
								 			con.query('select * from Voiture',function(err,result){
												mess="";
												res.render('pages/client/client.ejs',{client:req.session.client,mess:mess,voitureRI:voitureRI,voitureRP:result,adresse:adresse});
								 			});
								 		}
							 		});
			 					}
			 				});
			 			}else{
			 				mess="Votre course est prise en compte!";
			 				con.query('select * from Voiture WHERE disponible= "'+disponibilite+'"',function(err,result){
						 		if(result.length==0){
						 			con.query('select * from Voiture',function(err,result){
										mess="";
										res.render('pages/client/client.ejs',{client:req.session.client,mess:mess,voitureRI:null,voitureRP:result,adresse:adresse});
						 			});
						 		}else{
						 			voitureRI=result;
						 			con.query('select * from Voiture',function(err,result){
										mess="";
										res.render('pages/client/client.ejs',{client:req.session.client,mess:mess,voitureRI:voitureRI,voitureRP:result,adresse:adresse});
						 			});
						 		}
					 		});
			 			}
			 		});
				});
			}
		});
	}
});


//reservation
app.post('/reservation',function(req,res){
	var client =  req.session.client;
	var depart=req.body.depart;
	var arrivee=req.body.arrivee;
	var status1="attente prise en charge";
	var status2="à venir"
	var type=req.body.type;
	var clientID=req.session.clientId;
 	var voitureID;
 	var chauffeurID;
 	var now= new time.Date();
	var date=dateFormat(now,"isoDateTime");
	date=date.split("+");
 	if(clientID==null){
 		res.redirect('/');
 	}else{
 		fs.readFile('public/testAdresse.txt', function(err, data){
 			var adresse=data.toString('utf-8').split(";");
	 		if(req.body.res=="immediate"){
		 		var mess;
		 		var voitureID=req.body.type;
			 	con.query('select * from Voiture where VoitureID = "'+voitureID+'"',function(err,result){
			 		chauffeurID=parseInt(result[0].ChauffeurID);
			 		con.query('insert into Course (lieu_depart,lieu_darrivee,date,status,ClientID,VoitureID) values ("'+depart+'","'+arrivee+'","'+date[0]+'","'+status1+'","'+clientID+'","'+parseInt(voitureID)+'")',function(err,result){
			 			con.query('select * from Voiture WHERE disponible= 1',function(err,result){
							if(result.length==0){
								con.query('select * from Voiture',function(err,result){
									mess="réservation réussie, votre course est prise en compte.";
									res.render('pages/client/reservation.ejs',{client:client,mess:mess,voitureRI:null,voitureRP:result,adresse:adresse});
						 		});
							}else{
								mess="réservation réussie, votre course est prise en compte.";
								voitureRI=result;
						 		con.query('select * from Voiture',function(err,result){
									res.render('pages/client/reservation.ejs',{client:client,mess:mess,voitureRI:voitureRI,voitureRP:result,adresse:adresse});
						 		});
							}
						});
			 		});
			 	});
			}else if(req.body.res=="plustard"){
				var mess;
		 		var voitureID=req.body.type;
			 	con.query('select * from Voiture where VoitureID = "'+voitureID+'"',function(err,result){
			 		chauffeurID=parseInt(result[0].ChauffeurID);
			 		con.query('insert into Course (lieu_depart,lieu_darrivee,date,status,ClientID,VoitureID) values ("'+depart+'","'+arrivee+'","'+req.body.date+'","'+status2+'","'+clientID+'","'+parseInt(voitureID)+'")',function(err,result){
			 			if (err) throw err;
			 			con.query('select * from Voiture WHERE disponible= 1',function(err,result){
							if(result.length==0){
								con.query('select * from Voiture',function(err,result){
									mess="réservation réussie, votre course est prise en compte.";
									res.render('pages/client/reservation.ejs',{client:client,mess:mess,voitureRI:null,voitureRP:result,adresse:adresse});
						 		});
							}else{
								mess="réservation réussie, votre course est prise en compte.";
								voitureRI=result;
						 		con.query('select * from Voiture',function(err,result){
									res.render('pages/client/reservation.ejs',{client:client,mess:mess,voitureRI:voitureRI,voitureRP:result,adresse:adresse});
						 		});
							}
						});
			 		});
			 	});
			}
		});
 	}	
});

// <<<<====== PARTIE CLIENT ======>>>>>>>>>


//client

app.get('/client',function(req,res){
	var client =  req.session.client;
	var disponibilite=1;
 	clientId = req.session.clientId;
 	var mess;
 	var statusPC="prise en charge";
 	var statusAPD="arrivée point départ";
 	var statusEN="en cours";
 	if(clientId==null){
 		res.redirect('/');
 	}else{
 		fs.readFile('public/testAdresse.txt', function(err, data){
 			var adresse=data.toString('utf-8').split(";");
	 		con.query('select * from Course where status="'+statusPC+'"and ClientID="'+clientId+'"',function(err,result){
	 			if(result.length==0){
	 				con.query('select * from Course where status="'+statusAPD+'"and ClientID="'+clientId+'"',function(err,result){
	 					if(result.length==0){
			 				con.query('select * from Voiture WHERE disponible= "'+disponibilite+'"',function(err,result){
						 		if(result.length==0){
						 			con.query('select * from Voiture',function(err,result){
										mess="";
										res.render('pages/client/client.ejs',{client:client,mess:mess,voitureRI:null,voitureRP:result,adresse:adresse});
						 			});
						 		}else{
						 			voitureRI=result;
						 			con.query('select * from Voiture',function(err,result){
										mess="";
										res.render('pages/client/client.ejs',{client:client,mess:mess,voitureRI:voitureRI,voitureRP:result,adresse:adresse});
						 			});
						 		}
					 		});
	 					}else{
	 						mess="Votre chauffeur est sur le lieu de rendez-vous!";
			 				con.query('select * from Voiture WHERE disponible= "'+disponibilite+'"',function(err,result){
						 		if(result.length==0){
						 			con.query('select * from Voiture',function(err,result){
										mess="";
										res.render('pages/client/client.ejs',{client:client,mess:mess,voitureRI:null,voitureRP:result,adresse:adresse});
						 			});
						 		}else{
						 			voitureRI=result;
						 			con.query('select * from Voiture',function(err,result){
										mess="";
										res.render('pages/client/client.ejs',{client:client,mess:mess,voitureRI:voitureRI,voitureRP:result,adresse:adresse});
						 			});
						 		}
					 		});
	 					}
	 				});
	 			}else{
	 				mess="Votre course est prise en compte!";
	 				con.query('select * from Voiture WHERE disponible= "'+disponibilite+'"',function(err,result){
				 		if(result.length==0){
						 	con.query('select * from Voiture',function(err,result){
								mess="";
								res.render('pages/client/client.ejs',{client:client,mess:mess,voitureRI:null,voitureRP:result,adresse:adresse});
							});
						 }else{
						 	voitureRI=result;
						 	con.query('select * from Voiture',function(err,result){
								mess="";
								res.render('pages/client/client.ejs',{client:client,mess:mess,voitureRI:voitureRI,voitureRP:result,adresse:adresse});
						 	});
						}
			 		});
	 			}
	 		});
	 	});
 	}
});

app.get('/client/courses',function(req,res){
	var client =  req.session.client;
	var disponibilite=1;
 	clientId = req.session.clientId;
 	if(clientId==null){
 		res.redirect('/');
 	}else{
 		mess="";
 		res.render('pages/client/courses.ejs',{client:client,mess:mess});
 	}
});

app.get('/client/courses/avenir',function(req,res){
	var client =  req.session.client;
	var status="à venir";
	var mess;
 	clientId = req.session.clientId;
 	if(clientId==null){
 		res.redirect('/');
 	}else{
 		con.query('select * from Course where status="'+status+'" and ClientID="'+clientId+'"',function(err,result){
	 		if(result.length==0){
	 			mess="Course à venir";
	 			res.render('pages/client/avenir.ejs',{client:client,mess:mess,course:null});
	 		}else{
	 			mess="Course à venir";
	 			res.render('pages/client/avenir.ejs',{client:client,mess:mess,course:result});
	 		}
 		});
 	}
});

app.get('/client/courses/encours',function(req,res){
	var client =  req.session.client;
	var status="en cours";
	var mess;
 	clientId = req.session.clientId;
 	if(clientId==null){
 		res.redirect('/');
 	}else{
 		con.query('select * from Course where status="'+status+'" and ClientID="'+clientId+'"',function(err,result){
	 		if(result.length==0){
	 			mess="Course en cours";
	 			res.render('pages/client/encours.ejs',{client:client,mess:mess,course:null});
	 		}else{
	 			mess="Course en cours";
	 			res.render('pages/client/encours.ejs',{client:client,mess:mess,course:result[0]});
	 		}
 		});
 	}
});

app.get('/client/courses/terminees',function(req,res){
	var client =  req.session.client;
	var status="terminée";
	var mess;
 	clientId = req.session.clientId;
 	if(clientId==null){
 		res.redirect('/');
 	}else{
 		con.query('select * from Course where status="'+status+'" and ClientID="'+clientId+'"',function(err,result){
	 		if(result.length==0){
	 			mess="Courses Terminées";
	 			res.render('pages/client/terminees.ejs',{client:client,mess:mess,course:null});
	 		}else{
	 			mess="Courses Terminées";
	 			res.render('pages/client/terminees.ejs',{client:client,mess:mess,course:result});
	 		}
 		});
 	}
});

app.get('/client/profil',function(req,res){
	var client =  req.session.client;
 	var clientId = req.session.clientId;
 	var mess;
 	if(clientId==null){
 		res.redirect('/');
 	}else{
 		mess="";
 		res.render('pages/client/profil.ejs',{client:client,mess:mess});
 	}
 	
 	
});

app.get('/client/profil/infos',function(req,res){
	var client =  req.session.client;
 	var clientId = req.session.clientId;
 	var mess;
 	if(clientId==null){
 		res.redirect('/');
 	}else{
 		con.query('select * from Client WHERE ClientID= "'+clientId+'"',function(err,result){
 			mess="Mes infos";
 			res.render('pages/client/mesinfos.ejs',{client:result[0],mess:mess});
 		});
 	}
});

app.get('/client/profil/modification',function(req,res){
	var client =  req.session.client;
 	var clientId = req.session.clientId;
 	var mess;
 	if(clientId==null){
 		res.redirect('/');
 	}else{
 		mess="Modifier mes informations";
 		res.render('pages/client/modif.ejs',{client:client,mess:mess});
 	}
});

//modifier client
app.post('/client/modifier',function(req,res){
	var client =  req.session.client;
 	var clientId = req.session.clientId;
 	var mess;
 	if(clientId==null){
 		res.redirect('/');
 	}else{
 		if(req.body.prenom.length!=0){
 			con.query('update Client set prenom = "'+req.body.prenom+'" where ClientID= "'+clientId+'"',function(err,result){});
 		}
 		if(req.body.nom.length!=0){
 			con.query('update Client set nom = "'+req.body.nom+'" where ClientID= "'+clientId+'"',function(err,result){});
 		}
 		if(req.body.email.length!=0){
 			con.query('update Client set email = "'+req.body.email+'" where ClientID= "'+clientId+'"',function(err,result){});
 		}
 		if(req.body.numero.length!=0){
 			con.query('update Client set numero = "'+req.body.numero+'" where ClientID= "'+clientId+'"',function(err,result){});
 		}
 		var mess="Profil modifié";
 		res.render('pages/client/profil.ejs',{client:client,mess:mess});
 	}
});

//page pour une reservation
app.get('/reserver',function(req,res){
	var client =  req.session.client;
 	var clientId = req.session.clientId;
 	var mess;
 	disponible=1;
 	if(clientId==null){
 		res.redirect('/');
 	}else{
 		fs.readFile('public/testAdresse.txt', function(err, data){
 			var adresse=data.toString('utf-8').split(";");
	 		con.query('select * from Voiture WHERE disponible= "'+disponible+'"',function(err,result){
				if(result.length==0){

					con.query('select * from Voiture',function(err,result){
						mess="";
						res.render('pages/client/reservation.ejs',{client:client,mess:mess,voitureRI:null,voitureRP:result,adresse:adresse});
					});
				}else{
					var voitureRI=result;
					con.query('select * from Voiture',function(err,result){
						mess="";
						res.render('pages/client/reservation.ejs',{client:client,mess:mess,voitureRI:voitureRI,voitureRP:result,adresse:adresse});
					});
				}
			});
		});
 	}
});

app.get('/*',function(req,res){
	res.redirect('/');
})

app.listen(8000);
console.log('8000 le port magic');