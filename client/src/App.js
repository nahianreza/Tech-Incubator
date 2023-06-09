import React, { useState, useEffect } from "react";
import fire from "./fire";
import Login from "./components/login";
import AdminHome from "./components/adminHome";
import StudentHome from "./components/studentHome";
import "./App.css";

function App() {

  const[user, setUser] = useState('');
  const[email, setEmail] = useState('');
  const[password, setPassword] = useState('');
  const[emailError, setEmailError] = useState('');
  const[passwordError, setPasswordError] = useState('');
  const[hasAccount, setHasAccount] = useState(false);
  const[userRole, setUserRole] = useState('');
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [studentLogo, setStudentLogo] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogin = () => {
    clearErrors();
    fire
      .auth()
      .signInWithEmailAndPassword(email, password)
      .catch((err) => {
        switch (err.code) {
          case "auth/invalid-email":
          case "auth/user-disabled":
          case "auth/user-not-found":
            setEmailError(err.message);
            break;
          case "auth/wrong-password":
            setPasswordError(err.message);
            break;
          default:
            console.error(err.message); 
            break;
        }
      });
  };

  const handleSignUp = () => {
    clearErrors();
    fire
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(async (authUser) => {
        const storageRef = fire.storage().ref();
  
        if(userRole === 'admin' && companyLogo){
          const logoRef = storageRef.child(`logos/${companyLogo.name}`);
          return logoRef.put(companyLogo)
            .then(snapshot => {
              return snapshot.ref.getDownloadURL();
            })
            .then(downloadURL => {
              return fire.firestore().collection('users').doc(authUser.user.uid).set({
                role: userRole,
                companyName,
                companyLogo: downloadURL
              });
            })
            .then(() => {
              setUserRole(userRole); 
            });
        } else if (userRole === 'student' && studentLogo) {
          const logoRef = storageRef.child(`logos/${studentLogo.name}`);
          return logoRef.put(studentLogo)
            .then(snapshot => {
              return snapshot.ref.getDownloadURL();
            })
            .then(downloadURL => {
              return fire.firestore().collection('users').doc(authUser.user.uid).set({
                role: userRole,
                studentName,
                studentLogo: downloadURL
              });
            })
            .then(() => {
              setUserRole(userRole); 
            });
        } else {
          return fire.firestore().collection('users').doc(authUser.user.uid).set({
            role: userRole,
          })
          .then(() => {
            setUserRole(userRole); 
          });
        }
      })
      .catch((err) => {
        switch (err.code) {
          case "auth/email-already-in-use":
          case "auth/invalid-email":
            setEmailError(err.message);
            break;
          case "auth/weak-password":
            setPasswordError(err.message);
            break;
        }
      });
  };
  

	const handleLogout = () => {
		fire.auth().signOut();
	};

  const authListener = () => {
    fire.auth().onAuthStateChanged(async (user) => {
      if(user) {
        clearInputs();
        setUser(user);

        const doc = await fire.firestore().collection('users').doc(user.uid).get();
        if (doc.exists) {
          const data = doc.data();
          setUserRole(data.role);
          if(data.role === 'admin'){
            setCompanyName(doc.data().companyName);
            setCompanyLogo(doc.data().companyLogo);
          } else if (doc.data().role === 'student'){
            setStudentName(doc.data().studentName);
            setStudentLogo(doc.data().studentLogo);
          }
        }
      } else {
        setUser("");
        setUserRole("");
      }
      setLoading(false);
    });
  };

	useEffect(() => {
		authListener();
	}, []);


	const clearInputs = () => {
		setEmail("");
		setPassword("");
	};

	const clearErrors = () => {
		setEmailError("");
		setPasswordError("");
	};


  return (
    <div className="App">
      {loading ? (
        <div>Loading...</div>
      ) : user ? (
        userRole === 'admin' ? (
          <AdminHome handleLogout = {handleLogout} />
        ) : (
          <StudentHome handleLogout = {handleLogout} />
        )
      ): (
        <Login 
          email = {email}
          setEmail = {setEmail}
          password= {password}
          setPassword = {setPassword}
          hasAccount = {hasAccount}
          setHasAccount = {setHasAccount}
          handleLogin = {handleLogin}
          handleSignUp = {handleSignUp}
          emailError = {emailError}
          passwordError = {passwordError}
          userRole = {userRole}
          setUserRole = {setUserRole}
          companyName = {companyName}
          setCompanyName = {setCompanyName}
          setCompanyLogo = {setCompanyLogo}
          studentName = {studentName}
          setStudentName = {setStudentName}
          setStudentLogo = {setStudentLogo}  
        />
      )}
      
    </div>
  );
}

export default App;
