import { Box, LinearProgress, Typography } from '@mui/material';
import axios from 'axios';
import React, { useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom/dist';
import ServiceUtils from '../../Lib/ServiceUtils';
import UserContext from '../../Lib/UserContext/UserContext';

const LoginSuccess = () => {
  const { userId } = useParams();
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if(userId) {
      const fetchUserInfo = async () => {
        try {
          await axios.get(`${ServiceUtils.baseUrl}/users/${userId}/info`)
          .then(res => {
            const { data } = res;
            setUser(data);
            localStorage.setItem("UserId", userId);
            navigate('/profiles');
          });
        } catch (err) {
          console.error(err);
        }
      }
      fetchUserInfo();
    }
  }, [userId, navigate, setUser]);

  return(
    <Box display='flex' flexDirection='column' justifyContent='center' alignItems='center' height='75vh'>
      <Box my={3}>
        <Typography variant='h4'>Initializing</Typography>  
      </Box>
      <LinearProgress
        color='primary'
        style={{ width: "75%" }}
      />
    </Box>
  );
};

export default LoginSuccess;