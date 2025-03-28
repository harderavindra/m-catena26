import React, { useState, useEffect } from 'react';

const HealthCheck = () => {
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    fetch("https://m-catena-b.vercel.app/api/healthcheck", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setStatus(data.message))
      .catch((err) => setStatus("Error: " + err.message));
  }, []);

  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl font-bold">Backend Health Check</h1>
      <p>Status: {status}</p>
    </div>
  );
};

export default HealthCheck;
