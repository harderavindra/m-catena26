import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import InputText from "../components/common/InputText";
import Button from "../components/common/Button";
import { validateEmail, validatePassword } from "../utils/validation";
import LogoImage from '../assets/m-logo.svg'
import StatusMessageWrapper from "../components/common/StatusMessageWrapper";
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState('')
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, user } = useAuth();

  const navigate = useNavigate();
  useEffect(() => {
    setLoading(true);
    console.log("Login useEffect ", user)
    if (user) {
      setSuccess("Login successful! Redirecting...");

      setTimeout(() => navigate("/dashboard"), 1500);

    } else {
      setLoading(false);
    }


  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    try {
      setLoading(true)

      await login(email, password);
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
      setLoading(false)

    }
  };
  // if (loading) return <p>Loading...</p>;;
  return (
    <div className="bg-gray-50 w-screen h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg p-6 flex flex-col shadow-lg ring-1  shadow-gray-200/50  ring-gray-200/70 ring-offset-0">
        
        <h2 className="text-xl  mb-4 text-center font-bold">Welcome back</h2>
        <span className="flex gap-3 text-2xl items-end font-semibold font-base/2 py-2 justify-center"><img src={LogoImage} className="h-8" alt="Description" />Catena</span>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <InputText
            label="Email"
            name="email"
            type="email"
            value={email}
            handleOnChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            aria-label="Email"
            aria-describedby="email-error"
            required
          />
          <InputText
            label="Password"
            name="password"
            type="password"
            value={password}
            handleOnChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            aria-label="Password"
            aria-describedby="password-error"
            required
          />
          <Button
            className='w-full my-4'
            type="submit"
            disabled={loading} // Disable button during loading
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>      </form>
            <StatusMessageWrapper
                              loading={loading}
                              success={success}
                              error={error}
                          />
      
      </div>
    </div>
  );
};

export default LoginPage;
