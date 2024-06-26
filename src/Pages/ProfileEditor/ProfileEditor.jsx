import React, { useState, useEffect, useContext, useCallback } from 'react';
import UserContext from '../../Lib/UserContext/UserContext.jsx';
import { Box, CircularProgress, Divider, Grid, IconButton, Link, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import { useFormik } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';
import emptyProfile from '../../Lib/emptyProfile.json';
import * as yup from 'yup';

//icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PdfIcon from '@mui/icons-material/PictureAsPdf';
import RenameIcon from '@mui/icons-material/DriveFileRenameOutline';
import ResetIcon from '@mui/icons-material/RestartAlt';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Stars';

//profile components
import ContactViewer from '../../Components/ContactViewer/ContactViewer';
import SkillsViewer from '../../Components/SkillsViewer/SkillsViewer';
import WorkHistoryViewer from '../../Components/WorkHistoryViewer/WorkHistoryViewer';
import FormikTextField from '../../Components/FormikTextField/FormikTextField';
import AboutViewer from '../../Components/AboutViewer/AboutViewer';
import ProjectViewer from '../../Components/ProjectViewer/ProjectViewer';
import EducationViewer from '../../Components/EducationViewer/EducationViewer';

//API
import axios from 'axios';
import ServiceUtils from '../../Lib/ServiceUtils';
import LoadingContext from '../../Lib/LoadingContext/LoadingContext.jsx';
import { useSnackbar } from 'notistack';
import { CustomPrompt } from '../../Components/CustomPrompt/CustomPrompt.jsx';
import Tour from '../../Components/Tour/Tour.jsx';


//Removes all the string IDs we generated before saving
const cleanProfile = (prof) => {
  let profile = prof;
  profile.education = cleanArray(profile?.education);
  if(profile?.projects?.length > 0) {
    profile.projects = cleanArray(profile.projects);
    profile.projects.map(proj => proj.technologies = cleanArray(proj.technologies));
  }
  if(profile?.workHistory?.length > 0) {
    profile.workHistory = cleanArray(profile.workHistory);
    profile.workHistory.map(job => job.technologies = cleanArray(job.technologies));
  }
  if(profile?.bulletList?.length > 0) {
    profile.bulletList = cleanArray(profile.bulletList);
  }
  if(profile?.skills?.length > 0) {
    profile.skills = cleanArray(profile.skills);
  }
  return profile
};

const cleanArray = (array) => {
  if(array) {
    return array.map(entry => (
      Number.isInteger(entry?.id)
        ? entry
        : { ...entry, id: null }
    ));
  } else {
    return array;
  }
}

const ProfileEditor = () => {
  const { loading, setLoading } = useContext(LoadingContext);
  //separate loading state for reset functon so we don't refresh the whole page
  const [resetLoading, setResetLoading] = useState(false);
  //separate loading state for save function so we can show the loading indicator
  const [saveLoading, setSaveLoading] = useState(false);
  const [editingProfileName, setEditingProfileName] = useState(false);
  //for storing current profile name while editing so we don't have to call API if they cancel
  const [profileName, setProfileName] = useState('');
  //for storing name when elevating to master profile
  const [originalProfileName, setOriginalProfileName] = useState('');
  const [exportAnchor, setExportAnchor] = useState(null);
  const { user } = useContext(UserContext);
  const { profileId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const formik = useFormik({
    initialValues: emptyProfile,
    enableReinitialize: true,
    validationSchema: yup.object().shape({
      'name': yup.string().required('A profile name is required')
    })
  });

  const fetchProfile = useCallback(async (type) => {
    if(type === 'initial') {
      setLoading(true);
    }
    if(type === 'reset') {
      setResetLoading(true);
    }
    if(profileId === 'master' && user?.id) {
      try {
        await axios.get(`${ServiceUtils.baseUrl}/users/${user?.id}/profiles/master`)
        .then(res => {
          const { data } = res;
          formik.resetForm({ values: data });
        });
      } catch (err) {
        console.error(err);
      } finally {
        if(type === 'initial') {
          setLoading(false);
        }
        if(type === 'reset') {
          setResetLoading(false);
        }
      }
    } else {
      if(profileId !== 'master' && !loading) {
        try {
          await axios.get(`${ServiceUtils.baseUrl}/profiles/${profileId}`)
          .then(res => {
            const { data } = res;
            formik.resetForm({ values: data });
          });
        } catch (err) {
          console.error(err);
        } finally {
          if(type === 'initial') {
            setLoading(false);
          }
          if(type === 'reset') {
            setResetLoading(false);
          }
        }
      }
    }
  // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if(profileId !== 'new') {
      fetchProfile('initial');
    }
  }, [profileId, user, fetchProfile]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      let data = {};
      if(profileId === 'new' || (profileId === 'master' && !formik.values.id)) {
        await axios.post(`${ServiceUtils.baseUrl}/users/${user.id}/profiles`, cleanProfile(formik.values)).then(res => {
          data = res.data
        });
      } else {
        await axios.put(`${ServiceUtils.baseUrl}/profiles/${formik.values.id}`, cleanProfile(formik.values)).then(res => {
          data = res.data
        });
      }
      formik.resetForm({ values: data });
      enqueueSnackbar(`Successfully saved ${formik.values.name || 'Master Profile'}.`, { variant: 'success' });
    } catch (err) {
      console.error(err);
      enqueueSnackbar('An error occured while saving your profile.', { variant: 'error' })
    } finally {
      setSaveLoading(false);
    }
  };

  const handleProfileNameEdit = () => {
    if(!editingProfileName) {
      setProfileName(formik.values?.name);
      setEditingProfileName(true);
    }
  };

  const handleProfileNameEditConfirm = () => {
    setProfileName('');
    setEditingProfileName(false);
  };

  const handleProfileNameEditCancel = () => {
    formik.setFieldValue('name', profileName);
    setEditingProfileName(false);
  };

  const handleProfileReset = () => {
    fetchProfile('reset');
  };

  const handleElevateToMaster = () => {
    if(!formik.values.masterProfile) {
      formik.setFieldValue('masterProfile', true);
      setOriginalProfileName(formik.values.name);
      formik.setFieldValue('name', 'Master Profile');
    } else {
      formik.setFieldValue('masterProfile', false);
      formik.setFieldValue('name', originalProfileName);
      setOriginalProfileName('');
    }
  };

  const isCreator = formik.values?.user?.id === user?.id;

  // UseUnsavedChangesWarning(formik.dirty);

  return(
    <>
      {!loading && formik.values &&
        <Grid container rowGap={2} columnSpacing={2} mt={1} mb={4}>
          <Grid container marginTop={2}>
            <Grid item xs={4} pl={1}>
              <Tooltip title='Back'>
                <IconButton 
                  onClick={handleBack}
                  disabled={loading}
                  tour-id="back"
                >
                  <ArrowBackIcon color='primary' />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item xs={4}>
              {!(profileId === 'new')
              ?
                <Box display='flex' justifyContent='center' tour-id="name">
                  {!editingProfileName 
                    ?
                    <Box display='flex' flexDirection='column' justifyContent='center'>
                      <Typography variant='h5' align='center'>{profileId !== 'master' ? formik?.values?.name : 'Master Profile'}</Typography>
                      {/* {(formik.values.masterProfile && profileId !== 'master' && isCreator) && 
                        <Typography variant='caption' align='center' color='darkGray'>
                          <i>This profile will become your master profile upon saving. Your current master profile will be stored as a sub-profile.</i>
                        </Typography>
                      } */}
                    </Box>
                    :
                    <Box display='flex' width='100%' justifyContent='right' ml={5} alignItems='center'>
                      <FormikTextField 
                        name='name'
                        label='Profile Name'
                        formik={formik}
                      />
                      <Box ml={1} display='flex' flexDirection='column'>
                        <IconButton onClick={handleProfileNameEditConfirm} disabled={!formik.isValid}>
                          <CheckIcon color={formik.isValid ? 'primary' : 'disabled'} />
                        </IconButton>
                        <IconButton onClick={handleProfileNameEditCancel}>
                          <CloseIcon color='secondary' />
                        </IconButton>
                      </Box>
                    </Box>
                  }
                </Box>
              :
                <Box display='flex' justifyContent='center'>
                  <FormikTextField 
                    name='name'
                    label='Profile Name'
                    formik={formik}
                  />
                </Box>
              }
            </Grid>
            <Grid item xs={4}>
              <Box display='flex' justifyContent='right'>
                {(!(profileId === 'new') && isCreator) &&
                  <>
                    <Tooltip title="Rename Profile" tour-id="rename">
                      <IconButton onClick={handleProfileNameEdit} disabled={formik.values?.masterProfile} tour-id="rename">
                        <RenameIcon color={formik.values?.masterProfile ? 'disabled' : 'primary'} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={formik.values.masterProfile ? 'Unset Master Profile' : 'Set Master Profile'}>
                      <IconButton onClick={handleElevateToMaster} disabled={profileId === 'master'} tour-id="elevate">
                        <StarIcon color={profileId === 'master' || formik.values.masterProfile ? 'golden' : 'primary'} />
                      </IconButton>
                    </Tooltip>
                  </>
                }
                {!(profileId === 'new') &&
                  <>
                    {!resetLoading
                      ?
                        <Tooltip title="Revert Changes">
                          <IconButton onClick={handleProfileReset} tour-id="revert">
                            <ResetIcon color='primary' />
                          </IconButton>
                        </Tooltip>
                      :
                        <IconButton disabled tour-id="revert">
                          <CircularProgress color='primary' size={20}/>
                        </IconButton>
                    }
                  </>
                }
                {!saveLoading
                  ?
                    <Tooltip title='Save Profile'>
                      <IconButton onClick={handleSave} disabled={loading} tour-id="save">
                        <SaveIcon color='primary' />
                      </IconButton>
                    </Tooltip>
                  :
                    <IconButton disabled tour-id="save">
                      <CircularProgress color='primary' size={20}/>
                    </IconButton>
                }
                {!(profileId === 'new') &&
                  <Tooltip title='Export to PDF'>
                    <IconButton 
                      onClick={(e) => setExportAnchor(e.currentTarget)}
                      disabled={loading}
                      target='_blank'
                      tour-id="pdf"
                    >
                      <PdfIcon color='primary' />
                    </IconButton>
                  </Tooltip>
                }
              </Box>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12} md={6}>
            <Grid item mb={2} tour-id="contact">
              <ContactViewer formik={formik} />
            </Grid>
            <Grid item tour-id="education">
              <EducationViewer formik={formik} />
            </Grid>
          </Grid>
          <Grid item xs={12} md={6} tour-id="about">
            <AboutViewer formik={formik} />
          </Grid>
          <Grid item xs={12} md={6} tour-id="workhistory">
            <WorkHistoryViewer formik={formik} />
          </Grid>
          <Grid item xs={12} md={6} tour-id="projects">
            <ProjectViewer formik={formik} />
          </Grid>
          <Grid item xs={12} tour-id="skills">
            <SkillsViewer formik={formik} />
          </Grid>
        </Grid>
      }
      <CustomPrompt when={formik.dirty && !saveLoading} message='You have unsaved changes. Are you sure you want to continue?' beforeUnload={true}  />
      <Tour variant='profileEditor' />
      <Menu
        anchorEl={exportAnchor}
        onClose={() => setExportAnchor(null)}
        open={Boolean(exportAnchor)}
      >
        <MenuItem component={Link} target='_blank' href={`${ServiceUtils.baseUrl}/profiles/${formik.values?.id}/pdf`}>Standard</MenuItem>
        <MenuItem component={Link} target='_blank' href={`${ServiceUtils.baseUrl}/profiles/${formik.values?.id}/pdf?secondary=true`}>Columns</MenuItem>
      </Menu>
    </>
  );
};

export default ProfileEditor;