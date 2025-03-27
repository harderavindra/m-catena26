import { useState, useEffect } from "react";
import { fetchBrandTreasuryList } from "../api/brandTreasury";

const useFetchBrandTreasuries = (page = 1, limit = 10, documentType = "", starred = false,myDocuments=false, search = "") => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  

  useEffect(() => {
    const getDocuments = async () => {
      setLoading(true);
      try {
        const response = await fetchBrandTreasuryList(page, limit, documentType, starred, myDocuments,search);
        setDocuments(response.data);
        setPagination(response.pagination);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch brand treasury documents.");
      }finally{
      setLoading(false);
    }
    };

    getDocuments();
  }, [page, limit, documentType, starred, myDocuments, search]); // Removed `userType`

  return { documents, loading, error, pagination };
};

export default useFetchBrandTreasuries;
