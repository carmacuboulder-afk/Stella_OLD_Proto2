import React, { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // The frontend requests data from the backend
    fetch(`${process.env.REACT_APP_API_URL}/hello`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData({ message: "Backend not reachable" }));
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "4rem" }}>
      <h1>React + Express Demo</h1>
      {data ? (
        <>
          <p>{data.message}</p>
          <p>Visits: {data.totalVisits}</p>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default App;