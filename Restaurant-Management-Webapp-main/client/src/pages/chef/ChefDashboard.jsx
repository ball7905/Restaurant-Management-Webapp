const ChefDashboard = ({ message }) => {
  return (
    <div className="dummy-container">
      <h1>This is a Dummy Component</h1>
      {message && <p>{message}</p>}
      <button onClick={() => alert("Dummy button clicked!")}>Click Me</button>
    </div>
  );
};

export default ChefDashboard;
