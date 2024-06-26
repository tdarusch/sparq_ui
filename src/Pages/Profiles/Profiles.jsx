import React, { useContext, useEffect, useState } from 'react';
import ArrowBack from '@mui/icons-material/ArrowBackIosNew';
import ArrowForward from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterIcon from '@mui/icons-material/FilterList';
import ClearFilterIcon from '@mui/icons-material/FilterListOff';
import AddIcon from '@mui/icons-material/NoteAdd';
import ResetIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import StarsIcon from '@mui/icons-material/Stars';
import { 
  Box, 
  Button, 
  Chip, 
  CircularProgress, 
  Divider, 
  Grid, 
  IconButton, 
  LinearProgress, 
  List, 
  ListItem, 
  ListSubheader, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Tooltip, 
  Typography 
} from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import FormikTextField from '../../Components/FormikTextField/FormikTextField';
import Tour from '../../Components/Tour/Tour';
import LoadingContext from '../../Lib/LoadingContext/LoadingContext';
import ServiceUtils from '../../Lib/ServiceUtils';
import UserContext from '../../Lib/UserContext/UserContext';
import ProfileDeleteDialog from '../Profiles/ProfileDeleteDialog';

const searchParams = [
  {
    name: 'name',
    label: 'Profile Name'
  },
  {
    name: 'technology',
    label: 'Technology'
  },
  {
    name: 'bio',
    label: 'Bio'
  },
  {
    name: 'email',
    label: 'Email'
  },
  {
    name: 'phone',
    label: 'Phone Number'
  },
  {
    name: 'headline',
    label: 'Headline'
  },
  {
    name: 'company',
    label: 'Company'
  },
  {
    name: 'school',
    label: 'School'
  },
  {
    name: 'project',
    label: 'Project Name'
  },
  {
    name: 'skill',
    label: 'Skill'
  }
];

const initialValues = {
  name: null,
  bio: null,
  email: null,
  phone: null,
  headline: null,
  company: null,
  school: null,
  project: null,
  skill: null
}

const Profiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { user } = useContext(UserContext);
  const { loading, setLoading } = useContext(LoadingContext);
  const navigate = useNavigate();
  const [ profileLoading, setProfileLoading ] = useState(false);
  const [ tableLoading, setTableLoading ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [ searchOpen, setSearchOpen ] = useState(false);
  const [ activeFilters, setActiveFilters ] = useState([]);
  const [ selectDisabledIndex, setSelectDisabledIndex ] = useState(-1);
  const [ pageSize, setPageSize ] = useState(10);
  const [ pageNumber, setPageNumber ] = useState(1);
  const [ totalResults, setTotalResults ] = useState(0);
  const [ lastPage, setLastPage ] = useState(0);
  const formik = useFormik({
    initialValues: initialValues,
    validateOnChange: false,
    enableReinitialize: true
  });

  const fetchProfiles = async (variant, params) => {
    if(user?.id) {
      if(variant === 'initial') {
        setLoading(true);
      } else {
        setTableLoading(true);
      }
      try {
        await axios.get(`${ServiceUtils.baseUrl}/users/${user.id}/profiles/page`, { params: { ...params, pageNumber, pageSize }})
        .then(res => {
          const { data } = res;
          setProfiles(data.profiles);
          setLastPage(data.lastPage);
          setTotalResults(data.totalResults);
        });
      } catch (err) {
        console.error(err);
      } finally {
        if(variant === 'initial') {
          setLoading(false);
        } else {
          setTableLoading(false);
        }
      }
    }
  };

  useEffect(() => {
    fetchProfiles('initial', null);
  //only need to do this on mount, can't add it to the dep array or it infinite rerenders
  //and we need to declare it outside so we can refresh table on filter/delete
  //eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    fetchProfiles(null, formik.values);
    // eslint-disable-next-line
  }, [pageNumber, pageSize]);

  const handleAddProfile = async () => {
    setProfileLoading(true);
    try {
      await axios.post(`${ServiceUtils.baseUrl}/users/${user.id}/profiles/master/clone`)
      .then(res => {
        const { data } = res;
        navigate(`/profiles/${data}`);
      })
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
  }

  const handleDialogDelete = async (profileId) => {
    try {
      await axios.delete(`${ServiceUtils.baseUrl}/profiles/${profileId}`);
      enqueueSnackbar(`Profile successfully deleted.`, { variant: 'success' });
      setDeleteDialogOpen(false);
      fetchProfiles(null, formik.values);
    }
    catch (err) {
      console.error(err);
      enqueueSnackbar(`An error occurred while deleting the profile.`, { variant: 'error' });
    }
  }

  const handleSearchReset = () => {
    formik.setValues(initialValues);
    setActiveFilters([]);
    setPageNumber(1);
    fetchProfiles(null, null);
  };

  const handleApplyFilters = (params) => {
    setPageNumber(1);
    fetchProfiles(null, params);
    setActiveFilters(Object.keys(params).filter(key => params[key]).map(key => ({
        name: key,
        label: searchParams.find(param => param.name === key).label,
        value: params[key]
    })));
  };

  return(
    <>
    {!loading &&
      <Grid container justifyContent='center' width={'100%'} mt={5} columnSpacing={2} mb={5}>
        {activeFilters.length > 0 &&
          <Box display='flex' overflow='auto' justifyContent='left' alignItems='center' mb={1} px={2} width='100%'>
            <Box display='flex' alignItems='center' p={1}>
              <Box mr={1}>
                <FilterIcon color='primary'/>
              </Box>
              <Typography sx={{ color: 'disabled' }}>Filters:</Typography>
            </Box>
            {activeFilters.map(filter => (
              <Chip 
                variant='outlined' 
                color='primary' 
                label={`${filter.label}: ${filter.value}`}
                sx={{ marginX: 0.5 }}
              />
            ))}
          </Box>
        }
        <Grid item xs={searchOpen ? 9 : 12}>
          <TableContainer component={Paper}>
            {tableLoading && <LinearProgress color='primary' />} 
            <Table sx={{backgroundColor: 'elementBackground.main'}}>
              <TableHead>
                <TableRow>
                  <TableCell align='left'>
                    <Box my={1}>
                      <Typography variant='h5' sx={{ userSelect: 'none' }}>
                        {user?.name ? `${user.name}'s Profiles` : 'Profiles'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align='right'>
                    {(!searchOpen && activeFilters?.length > 0) &&
                      <Tooltip title='Reset Filters'>
                        <IconButton onClick={handleSearchReset} color='primary'>
                          <ClearFilterIcon />
                        </IconButton>
                      </Tooltip>
                    }
                    {!searchOpen &&
                      <Tooltip
                        title='Search'
                      >
                        <IconButton
                          onClick={() => setSearchOpen(true)}
                          color='primary'
                          tour-id="search"
                        >
                          <SearchIcon />
                        </IconButton>
                      </Tooltip>
                    }
                    {!profileLoading ?
                      <Tooltip
                        title='Add Profile'
                      >
                        <IconButton
                          onClick={handleAddProfile}
                          color='primary'
                          tour-id="new-profile"
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                    :
                    <IconButton disabled>
                      <CircularProgress color='primary' size={20}/>
                    </IconButton>
                    }
                  </TableCell>
                </TableRow>
                <TableRow
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/profiles/master`)}
                  tour-id="master-profile"
                >
                  <TableCell>
                    <Typography fontWeight='bold'>Master Profile</Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Box display='flex' alignItems='center' justifyContent='right'>
                      <StarsIcon color='golden' sx={{ marginRight: 1 }}/>
                    </Box>
                  </TableCell>
                </TableRow>
                <TableRow tour-id="sub-profiles">
                  <TableCell>
                    <Typography fontWeight='bold'>Sub-Profile Name</Typography>
                  </TableCell>
                  <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                    <Box display='flex' justifyContent='right' alignItems='center'>
                      <Typography fontWeight='bold'>Created</Typography>
                      <IconButton disabled sx={{ marginLeft: 3.3 }}>
                        <DeleteIcon sx={{ color: 'elementBackground.main' }} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {profiles.map((profile, index) => (
                  <TableRow 
                    key={profile.id}
                    hover={selectDisabledIndex !== index}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/profiles/${profile.id}`)}
                  >
                    <TableCell>{profile.name}</TableCell>
                    <TableCell align='right'>
                      {dayjs(profile.createdDate).isValid() ? dayjs(profile.createdDate).format('MM/DD/YYYY') : 'N/A'}
                      <IconButton
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedProfileId(profile.id);
                          setDeleteDialogOpen(true);
                        }}
                        color='secondary'
                        onMouseEnter={() => setSelectDisabledIndex(index)}
                        onMouseLeave={() => setSelectDisabledIndex(-1)}
                        sx={{ marginLeft: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>                    
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box 
            display='flex' 
            alignItems='center' 
            justifyContent='space-between' 
            component={Paper} 
            sx={{ backgroundColor: 'elementBackground.main' }}
          >
            <Box display='flex' alignItems='center' ml={1.5}>
              <Typography>{`${totalResults} Result(s)`}</Typography>
            </Box>
            <Box display='flex' alignItems='center'>
              <IconButton 
                size='small' 
                color={pageSize === 10 ? 'primary' : 'disabled'}
                onClick={() => {setPageNumber(1); setPageSize(10)}}
                sx={{ marginInline: 0.5 }}
              >
                10
              </IconButton>
              <IconButton 
                size='small' 
                color={pageSize === 20 ? 'primary' : 'disabled'}
                onClick={() => {setPageNumber(1); setPageSize(20)}}
                sx={{ marginInline: 0.5 }}
              >
                20
              </IconButton>
              <IconButton 
                size='small' 
                color={pageSize === 30 ? 'primary' : 'disabled'}
                onClick={() => {setPageNumber(1); setPageSize(30)}}
                sx={{ marginInline: 0.5 }}
              >
                30
              </IconButton>
              <Typography>Results per page</Typography>
            </Box>
            <Box display='flex' alignItems='center'>
              <IconButton
                disabled={pageNumber === 1}
                onClick={() => setPageNumber(prevNum => prevNum - 1)}
              >
                <ArrowBack color={pageNumber === 1 ? 'disabled' : 'primary'} />
              </IconButton>
              <Typography>{`${pageNumber}/${lastPage}`}</Typography>
              <IconButton
                disabled={pageNumber === lastPage}
                onClick={() => setPageNumber(prevNum => prevNum + 1)}
              >
                <ArrowForward color={pageNumber === lastPage ? 'disabled' : 'primary'} />
              </IconButton>
            </Box>
          </Box>
        </Grid>
        {searchOpen &&
          <Grid item xs={3}>
            <List 
              sx={{
                backgroundColor: 'elementBackground.main',
              }}
              component={Paper}
            >
              <Box display='flex' justifyContent='space-between' alignItems='center' mx={1} mb={1}>
                <ListSubheader 
                  sx={{backgroundColor: 'elementBackground.main'}} 
                  align='center'
                >
                  Search Filters
                </ListSubheader>
                <Box>
                  <Tooltip title='Reset Filters'>
                    <IconButton onClick={handleSearchReset}>
                      <ResetIcon color='primary' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Close'>
                    <IconButton onClick={() => setSearchOpen(false)}>
                      <CloseIcon color='primary' />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Divider />
              {searchParams.map(param => (
                <ListItem sx={{ marginY: 1, paddingRight: 1, paddingLeft: 2 }} disableGutters>
                  <Box display='flex' alignItems='center' width='100%'>
                    <FormikTextField 
                      formik={formik}
                      name={param.name}
                      label={param.label}
                      InputLabelProps={{ shrink: true }}
                    />
                    <Tooltip title='Clear Filter' placement='right'>
                      <IconButton 
                        sx={{ marginLeft: 1 }}
                        disabled={!formik.values[param.name]}
                        onClick={() => {
                          formik.setValues({ ...formik.values, [param.name]: null });
                          if(activeFilters.find(filter => filter.name === param.name)) {
                            handleApplyFilters({ ...formik.values, [param.name]: null });
                          }
                        }}
                      >
                        <ClearFilterIcon color={formik.values[param.name] ? 'secondary' : 'disabled'} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              ))}
              <Box mb={1}>
                <Divider />
              </Box>
              <ListItem>
                  <Button 
                    variant='contained'
                    color='primary'
                    fullWidth
                    onClick={() => handleApplyFilters(formik.values)}
                  >
                    Apply Filters
                  </Button>
              </ListItem>
            </List>
          </Grid>
        }
        <Grid item xs={12} display='flex' justifyContent='right' component={Paper}>
          
        </Grid>
      </Grid>
    }
      {deleteDialogOpen &&
        <ProfileDeleteDialog
          profileId={selectedProfileId}
          onDelete={handleDialogDelete}
          onCancel={handleDialogCancel}
        />
      }
      <Tour onStart={() => {setSearchOpen(false)}} variant='profiles' />
    </>
  );
};

export default Profiles;