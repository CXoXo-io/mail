"use client";

import Image from "next/image";
import React, { useState, useEffect, useReducer } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { data } from "../city-data";
import Refresh from "./images/refreshicon.svg";
const options = ["Budget", "Standard", "Luxury"];
const languageOptions = ["English", "Spanish", "French", "Italian", "Arabic"];
const translatedValues = {
  English: "English",
  Spanish: "Español",
  French: "Français",
  Italian: "Italiano",
  Arabic: "عربي",
};

import { MailchimpFormContainer } from "./components/MailchimpFormContainer";

function generateResponse(
  selectedOption: string,
  selectedLanguage: string
): string {
  return `You selected ${selectedOption} in ${selectedLanguage}.`;
}
export default function Home() {
  const [request, setRequest] = useState<{ days?: string; city?: string }>({});
  let [itinerary, setItinerary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedOption, setSelectedOption] = useState<any>();
  const [selectedLanguage, setSelectedLanguage] = useState<any>("");
  const [response, setResponse] = useState(
    generateResponse(selectedOption, selectedLanguage)
  );
  const [isresfresh, setisRefresh] = useState<boolean>(false);
  let days = itinerary.split("Day");

  if (days.length > 1) {
    days.shift();
  } else {
    days[0] = "1" + days[0];
  }

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const selectedLanguage = event.target.value;
    const translatedValue = translatedValues[selectedLanguage] || "";
    setSelectedLanguage(selectedLanguage);
    console.log(translatedValue);
  }
  function checkCity(city?: string) {
    if (!city) return;
    const cityToLowerCase = city.toLowerCase();
    const cityData = data[cityToLowerCase];
    if (cityData) {
      const link = data[cityToLowerCase].link;
      return (
        <a target="_blank" rel="no-referrer" href={link}>
          {cityToLowerCase.charAt(0).toUpperCase() + cityToLowerCase.slice(1)}
        </a>
      );
    } else {
      return cityToLowerCase.charAt(0).toUpperCase() + cityToLowerCase.slice(1);
    }
  }

  const handleOptionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(event.target.value);
    setResponse(generateResponse(event.target.value, selectedLanguage));
  };

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedLanguage(event.target.value);
    setResponse(generateResponse(selectedOption, event.target.value));
  };

  const generateNewResponse = () => {
    setResponse(generateResponse(selectedOption, selectedLanguage));
  };

  async function hitAPI() {
    try {
      if (!request.city || !request.days) return;
      setMessage("Building itinerary...this may take 40 seconds");
      setLoading(true);
      setItinerary("");

      setTimeout(() => {
        if (!loading) return;
        setMessage("Getting closer ...");
      }, 2000);

      setTimeout(() => {
        if (!loading) return;
        setMessage("Almost there ...");
      }, 1500);

      const response = await fetch("/api/get-itinerary", {
        method: "POST",
        body: JSON.stringify({
          days: request.days,
          city: request.city,
          language:selectedLanguage,
          responseStyle:selectedOption

        }),
      });
      const json = await response.json();
      setisRefresh(true);

      const response2 = await fetch("/api/get-points-of-interest", {
        method: "POST",
        body: JSON.stringify({
          pointsOfInterestPrompt: json.pointsOfInterestPrompt,
        }),
      });
      const json2 = await response2.json();

      let pointsOfInterest = JSON.parse(json2.pointsOfInterest);
      let itinerary = json.itinerary;

      pointsOfInterest.map((point) => {
        // itinerary = itinerary.replace(point, `<a target="_blank" rel="no-opener" href="https://www.google.com/search?q=${encodeURIComponent(point + ' ' + request.city)}">${point}</a>`)
        itinerary = itinerary.replace(
          point,
          `[${point}](https://www.google.com/search?q=${encodeURIComponent(
            point + " " + request.city
          )})`
        );
      });

      setItinerary(itinerary);
      setLoading(false);
    } catch (err) {
      console.log("error: ", err);
      setMessage("");
    }
  }

  async function generatedNewResponse() {
    setisRefresh(false);
    setResponse(generateResponse(selectedOption, selectedLanguage));
    setLoading(false);
    setMessage("");
    request.city = "";
    request.days = "";
    setItinerary("");
    // // empty all states days country language
    // setRequest({})
    setSelectedOption(options);
    setSelectedLanguage(languageOptions);
  }

  useEffect(() => {
    checkRedirect();
  }, []);

  function checkRedirect() {
    if (window.location.hostname === "gpt-travel-advisor.vercel.app") {
      window.location.replace("https://www.roamaround.io/");
    }
  }

  return (
    <main>
      <div className="app-container">
        <h1 style={styles.header} className="hero-header">
          Roam Around
        </h1>
        <div style={styles.formContainer} className="form-container">
          <input
            style={styles.input}
            placeholder="City"
            onChange={(e) =>
              setRequest((request) => ({
                ...request,
                city: e.target.value,
              }))
            }
          />
          <input
            style={styles.input}
            placeholder="Days"
            onChange={(e) =>
              setRequest((request) => ({
                ...request,
                days: e.target.value,
              }))
            }
          />
          <select
            id="options"
            style={styles.input}
            value={selectedOption}
            onChange={handleOptionChange}
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
  style={styles.input}
  id="language"
  value={selectedLanguage}
  onChange={handleChange}
>
  {languageOptions.map((language) => (
    <option key={language} value={language}>
      {translatedValues[language] || language}
    </option>
  ))}
</select>

          <button className="input-button" onClick={hitAPI}>
            Build Itinerary
          </button>
        </div>
        <div className="results-container">
          {isresfresh && (
            <button className="input-button" onClick={generatedNewResponse}>
              <Image
                src={Refresh}
                alt="Roam Around Logo"
                width={20}
                height={20}
              />
            </button>
          )}

          {loading && <p>{message}</p>}
          {itinerary && (
            <h3 style={styles.cityHeadingStyle}>
              Ok, we've made your itinerary for {checkCity(request.city)}
            </h3>
          )}
          {itinerary &&
            days.map((day, index) => (
              <div style={{ marginBottom: "30px" }} key={index}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: (props) => {
                      return (
                        <a target="_blank" rel="no-opener" href={props.href}>
                          {props.children}
                        </a>
                      );
                    },
                  }}
                >
                  {`Day ${day}`}
                </ReactMarkdown>
              </div>
            ))}
          {itinerary && (
            <h3 style={styles.cityHeadingStyle}>
              {" "}
              Ready to take the next step? Support us by booking{" "}
              <a
                target="_blank"
                rel="no-opener"
                href="https://wayaway.tp.st/NoWTlbkP"
              >
                here
              </a>
            </h3>
          )}
        </div>
        <div style={styles.subscribeformContainer}>
          <h3 style={styles.cityHeadingStyle}>Get updates on roamaround.io</h3>
          <div className="email-container">
            <MailchimpFormContainer />
          </div>
        </div>
      </div>
    </main>
  );
}

//

const styles = {
  cityHeadingStyle: {
    color: "white",
    marginBottom: "20px",
  },
  header: {
    textAlign: "center" as "center",
    marginTop: "60px",
    color: "#c683ff",
    fontWeight: "900",
    fontFamily: "Poppins",
    fontSize: "68px",
  },
  input: {
    padding: "10px 14px",
    marginBottom: "4px",
    outline: "none",
    fontSize: "16px",
    width: "100%",
    borderRadius: "8px",
  },
  subscribeformContainer: {
    display: "flex",
    flexDirection: "column" as "column",
    marginTop: "20px",
    marginBottom: "10px",
    marginLeft: "10px",
    padding: "20px",
    paddingBottom: "10px",
    boxShadow: "0px 0px 12px rgba(198, 131, 255, .2)",
    borderRadius: "10px",
    width: "30%",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column" as "column",
    margin: "20px auto 0px",
    padding: "20px",
    boxShadow: "0px 0px 12px rgba(198, 131, 255, .2)",
    borderRadius: "10px",
  },
  result: {
    color: "white",
  },
};

{
  /* <div className="app-container">
        <h1 style={styles.header} className="hero-header">Roam Around</h1>
        <div style={styles.formContainer} className="form-container">
          <input style={styles.input}  placeholder="City" onChange={e => setRequest(request => ({
            ...request, city: e.target.value
          }))} />
          <input style={styles.input} placeholder="Days" onChange={e => setRequest(request => ({
            ...request, days: e.target.value
          }))} />
          <button className="input-button"  onClick={hitAPI}>Build Itinerary</button>
        </div>
        <div className="results-container">
        {
          loading && (
            <p>{message}</p>
          )
        }
        {
          itinerary && (
            <h3 style={styles.cityHeadingStyle}>Ok, we've made your itinerary for {checkCity(request.city)}</h3>
          )
        }
        {
          itinerary && days.map((day, index) => (
            <div
              style={{marginBottom: '30px'}}
              key={index}
            >
              <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: props => {
                    return <a target="_blank" rel="no-opener" href={props.href}>{props.children}</a>
                }
            }}
              >
                {`Day ${day}`}
                </ReactMarkdown>
            </div>
          ))
          }
          {
            itinerary && (
              <h3 style={styles.cityHeadingStyle}> Ready to take the next step? Support us by booking <a target="_blank" rel="no-opener" href="https://wayaway.tp.st/NoWTlbkP">here</a></h3>
            )
          }
        
        </div>
      </div> */
}

// async function hitAPI() {
//   try {
//     if (!request.city || !request.days) return;
//     setMessage("Building itinerary...this may take 40 seconds");
//     setLoading(true);
//     setItinerary("");

//     setTimeout(() => {
//       if (!loading) return;
//       setMessage("Getting closer ...");
//     }, 2000);

//     setTimeout(() => {
//       if (!loading) return;
//       setMessage("Almost there ...");
//     }, 15000);

//     const response = await fetch("/api/get-itinerary", {
//       method: "POST",
//       body: JSON.stringify({
//         days: request.days,
//         city: request.city,
//       }),
//     });
//     const json = await response.json();

//     const response2 = await fetch("/api/get-points-of-interest", {
//       method: "POST",
//       body: JSON.stringify({
//         pointsOfInterestPrompt: json.pointsOfInterestPrompt,
//       }),
//     });
//     const json2 = await response2.json();

//     let pointsOfInterest = JSON.parse(json2.pointsOfInterest);
//     let itinerary = json.itinerary;

//     pointsOfInterest.map((point) => {
//       // itinerary = itinerary.replace(point, `<a target="_blank" rel="no-opener" href="https://www.google.com/search?q=${encodeURIComponent(point + ' ' + request.city)}">${point}</a>`)
//       itinerary = itinerary.replace(
//         point,
//         `[${point}](https://www.google.com/search?q=${encodeURIComponent(
//           point + " " + request.city
//         )})`
//       );
//     });

//     setItinerary(itinerary);
//     setLoading(false);
//   } catch (err) {
//     console.log("error: ", err);
//     setMessage("");
//   }
// }
