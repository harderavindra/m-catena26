import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, logout } = useAuth();



  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome, {user?.id}!</p>
    </div>
  );
};

export default Dashboard;
