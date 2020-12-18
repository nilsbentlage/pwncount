import firebase from "firebase/app";
import "firebase/database";
import "firebase/auth";

import { BrowserRouter, Route, Switch } from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";
import firebaseConfig from "./firebase/config";

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function App() {
  const [counter, setCounter] = useState(0);
  const [user, setUser] = useState();
  const [customText, setCustomText] = useState("- loading -");

  useEffect(() => {
    db.ref("/counter/" + user).on("value", (snapshot) => {
      if (snapshot.val()) {
        setCustomText(snapshot.val().customText);
        setCounter(snapshot.val().count);
      } else {
        setCustomText("I have been pwned");
      }
    });
  });

  function Backend() {
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        setUser(user.uid);
      } else {
        console.log("no user found");
      }
    });

    return user ? <LoggedIn text={customText} /> : <Login />;

    function Login() {
      const [userName, setUserName] = useState("");
      const [userPassword, setUserPassword] = useState("");
      const [loginError, setLoginError] = useState("");

      function submitLogin(event) {
        event.preventDefault();
        firebase
          .auth()
          .signInWithEmailAndPassword(
            userName.toLocaleLowerCase(),
            userPassword
          )
          .then(function () {
            console.log(userName);
          })
          .catch(function (e) {
            setLoginError(e.message);
            setTimeout(function () {
              setLoginError("");
            }, 4000);
          });
      }

      return (
        <div>
          <form className="container flex">
            <h1>PWNCount</h1>

            <div className="flex">
              <input
                type="text"
                className="inputform"
                placeholder="E-Mail"
                autoComplete="username"
                onChange={(event) => setUserName(event.target.value)}
              />
              <input
                type="password"
                className="inputform"
                autoComplete="current-password"
                placeholder="Password"
                onChange={(event) => setUserPassword(event.target.value)}
              />
              <button type="submit" onClick={(event) => submitLogin(event)}>
                Login
              </button>
            </div>

            <a href="/signup">Create a new Account</a>
            {loginError && <div className="error">{loginError}</div>}
          </form>
        </div>
      );
    }

    function LoggedIn(props) {
      const shareLink = window.location.host + "/display/" + user;
      const initialHint = "";
      const [hint, setHint] = useState(initialHint);
      const [textField, setTextField] = useState(props.text);
      const [applyError, setApplyError] = useState(false);

      function raiseCounter() {
        const value = counter + 1;
        setCounter(value);
        db.ref("/counter/" + user + "/count").set(value);
      }

      function applyTitle() {
        db.ref("/counter/" + user + "/customText").set(textField);
      }

      function resetCounter() {
        db.ref("/counter/" + user + "/count").set(0);
        setCounter(0);
        applyTitle();
      }

      function toClipboard(newClip) {
        try {
          navigator.clipboard.writeText(newClip);
        } catch (error) {
          setHint("Clipboard API not available");
          setTimeout(function () {
            setHint("");
          }, 4000);
        }

        setHint("Copied!");
        setTimeout(function () {
          setHint(initialHint);
        }, 4000);
      }

      return (
        <div className="container flex">
          <h1>PWNCount</h1>
          <div>
            <input
              type="text"
              id="customText"
              value={textField}
              onChange={(e) => {
                const value = e.target.value;
                setTextField(value);
                if (value !== customText) {
                  setApplyError("Reset the counter to apply the new title");
                } else {
                  setApplyError("");
                }
              }}
            />
            <div id="output">{counter}</div>
            <div className="text">Times</div>

            <div>
              <button id="pwned" onClick={() => raiseCounter()}>
                COUNT UP!
              </button>
              <button id="reset" onClick={() => resetCounter()}>
                X
              </button>
            </div>
          </div>
          <div>
            <h4>This is your view-Link:</h4>
            <div id="url">{shareLink}</div>
            <button
              id="sharelink"
              value={shareLink}
              onClick={(e) => toClipboard(e.target.value)}
            >
              Copy to Clipboard
            </button>
            <br />
            {hint && (
              <span
                className="error"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              >
                {hint}
              </span>
            )}
          </div>
          <a id="logout" href="/" onClick={() => firebase.auth().signOut()}>
            Logout
          </a>
          <div id="copyright">
            Created by{" "}
            <a
              href="mailto:nils.bentlage@googlemail.com"
              rel="noreferrer"
              target="_blank"
            >
              Nils Bentlage
            </a>
          </div>
          {applyError && <div className="error">{applyError}</div>}
        </div>
      );
    }
  }

  function Frontend(props) {
    const [frontEndCount, setFrontEndCount] = useState(0);
    const [frontEndText, setFrontEndText] = useState("");

    useEffect(() => {
      db.ref("/counter/" + props.match.params.username).on(
        "value",
        (snapshot) => {
          const data = snapshot.val();
          setFrontEndCount(data.count);
          setFrontEndText(data.customText || "I have been PWNed");
          console.log(data.customText);
        }
      );
    });

    return (
      <div className="container flex">
        <div>
          <div className="text">{frontEndText}</div>
          <div id="output">{frontEndCount}</div>
          <div className="text">Times</div>
        </div>
      </div>
    );
  }

  function SignUp() {
    const [newName, setNewName] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordRepeat, setNewPasswordRepeat] = useState("");
    const [passwordError, setPasswordError] = useState("");

    function submitSignUp(event) {
      event.preventDefault();
      if (newPassword === newPasswordRepeat) {
        firebase
          .auth()
          .createUserWithEmailAndPassword(
            newName.toLocaleLowerCase(),
            newPassword
          )
          .then(() => {
            console.log(newName + "Just sigend up");
            window.location = "/";
          })
          .catch((e) => {
            setPasswordError(e.message);
            setTimeout(function () {
              setPasswordError("");
            }, 4000);
          });
      } else {
        setPasswordError("Password Repeat is incorrect");
        setTimeout(function () {
          setPasswordError("");
        }, 4000);
      }
    }

    return (
      <div>
        <form className="container flex">
          <h1>PWNCount</h1>
          <div className="flex">
            <input
              type="text"
              className="inputform"
              placeholder="E-Mail"
              autoComplete="username"
              onChange={(event) => setNewName(event.target.value)}
            />
            <input
              type="password"
              className="inputform"
              autoComplete="new-password"
              placeholder="Password"
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <input
              type="password"
              className="inputform"
              autoComplete="new-password"
              placeholder="Repeat Password"
              onChange={(event) => setNewPasswordRepeat(event.target.value)}
            />
            <button type="submit" onClick={(event) => submitSignUp(event)}>
              Sign Up
            </button>
          </div>
          <a href="/">Back to Login / Home</a>
          {passwordError && <div className="error">{passwordError}</div>}
        </form>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/" component={Backend} />
        <Route exact path="/display/:username" component={Frontend} />
        <Route exact path="/signup" component={SignUp} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
