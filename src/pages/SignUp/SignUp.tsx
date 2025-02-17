import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { Eye, EyeSlash } from "@phosphor-icons/react";

import Background from "assets/images/login.jpg";
import InputLabel from "ui/InputLabel";
import LogoDark from "assets/images/LogoDark.svg";
import LogoLight from "assets/images/Logo.svg";
import axios from "api/axios";
import endpoints from "api/endpoints";
import { login } from "api/login";
import paths from "shared/paths";
import { useAlert } from "context/AlertProvider";
import { useIntl } from "react-intl";
import { useMutation } from "react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useThemMode } from "context/ThemeProvider";
import { useUser } from "context/UserProvider";

type SignUpForm = { name: string; email: string; password: string };

const SignUp = () => {
  const intl = useIntl();
  const { showAlert } = useAlert();
  const { setUser } = useUser();
  const navigate = useNavigate();

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const { mode } = useThemMode();
  const Logo = mode === "light" ? LogoLight : LogoDark;

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<SignUpForm>({
    mode: "all",
  });

  const { mutate, isLoading } = useMutation({
    mutationKey: [endpoints.singup],
    mutationFn: (data: SignUpForm) =>
      axios.post(endpoints.singup, {
        ...data,
        farmId: "66cd76b5b637809116750d0c",
      }),

    onSuccess: ({ data }: any) => {
      if (data.error) {
        console.log(data);
        showAlert(data.message, "error");
        return;
      }

      const values = getValues();
      signin({ email: values.email, password: values.password });
    },
    onError: () => {
      showAlert(
        intl.formatMessage({
          id: "login.signup.error",
          defaultMessage:
            "Oops! Seems like you are having issues when creating your account, please contact support.",
        }),
        "error"
      );
    },
  });

  const { isLoading: logingIn, mutate: signin } = useMutation({
    mutationKey: [endpoints.signin],
    mutationFn: login,
    onSuccess: (data) => {
      data?.user && setUser(data.user);
      showAlert(
        intl.formatMessage({
          id: "login.singup.welcome",
          defaultMessage: "Welcome!",
        }),
        "success"
      );
      navigate("/");
    },
    onError: () => {
      showAlert(
        intl.formatMessage({
          id: "login.signup.error",
          defaultMessage:
            "Oops! Seems like you are having issues when creating your account, please contact support.",
        }),
        "error"
      );
    },
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const onSubmit = (data: SignUpForm) => {
    console.log({ data });
    mutate(data);
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100%"
      sx={
        desktop
          ? {
              background: `url(${Background}) lightgray 50% / cover no-repeat`,
            }
          : {
              background: `url(${Background}) lightgray 50% / cover no-repeat`,
              backgroundPosition: "32%",
            }
      }
    >
      <Box
        display="flex"
        flexDirection={desktop ? "row" : "column"}
        justifyContent={desktop ? "flex-start" : "flex-end"}
        height={desktop ? "auto" : "100%"}
        width="100%"
      >
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          display="flex"
          flexDirection="column"
          gap="4rem"
          width={desktop ? "100%" : "auto"}
          maxWidth="564px"
          margin={desktop ? "0 0 0 50vw" : "1rem"}
          padding={desktop ? "3.5rem" : "2rem"}
          sx={{
            background: theme.palette.background.paper,
            borderRadius: "var(--radius-xl, 0.75rem)",
          }}
        >
          <Box display="flex" justifyContent="center">
            {<img src={Logo} height="50.96px" />}
          </Box>

          <Box display="flex" flexDirection="column" gap="2.5rem" width="100%">
            <Controller
              control={control}
              name="email"
              rules={{
                required: {
                  value: true,
                  message: intl.formatMessage({
                    id: "signup.required.message",
                    defaultMessage: "Required field",
                  }),
                },
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: intl.formatMessage({
                    id: "signup.email.format.validation.message",
                    defaultMessage: "Invalid format",
                  }),
                },
              }}
              render={({ field }) => {
                return (
                  <Box display="flex" flexDirection="column" gap={1}>
                    <InputLabel htmlFor="signup-email" required>
                      {intl.formatMessage({
                        id: "signup.email.label",
                        defaultMessage: "Email",
                      })}
                    </InputLabel>

                    <TextField
                      {...field}
                      id="signup-email"
                      type="email"
                      variant="outlined"
                      size="small"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      fullWidth
                    />
                  </Box>
                );
              }}
            />

            <Controller
              control={control}
              name="name"
              rules={{
                required: {
                  value: true,
                  message: intl.formatMessage({
                    id: "signup.required.message",
                    defaultMessage: "Required field",
                  }),
                },
                minLength: {
                  value: 3,
                  message: intl.formatMessage({
                    id: "signup.name.format.validation.message",
                    defaultMessage: "Name is too short",
                  }),
                },
              }}
              render={({ field }) => {
                return (
                  <Box display="flex" flexDirection="column" gap={1}>
                    <InputLabel htmlFor="signup-email" required>
                      {intl.formatMessage({
                        id: "signup.name.label",
                        defaultMessage: "Name",
                      })}
                    </InputLabel>

                    <TextField
                      {...field}
                      id="signup-name"
                      type="text"
                      variant="outlined"
                      size="small"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      fullWidth
                    />
                  </Box>
                );
              }}
            />

            <Controller
              control={control}
              name="password"
              rules={{
                required: {
                  value: true,
                  message: intl.formatMessage({
                    id: "signup.required.message",
                    defaultMessage: "Required field",
                  }),
                },
                minLength: {
                  value: 3,
                  message: intl.formatMessage({
                    id: "signup.password.format.validation.message",
                    defaultMessage: "Password is too short.",
                  }),
                },
              }}
              render={({ field }) => {
                return (
                  <Box display="flex" flexDirection="column" gap={1}>
                    <InputLabel htmlFor="signup-password" required>
                      {intl.formatMessage({
                        id: "signup.password.label",
                        defaultMessage: "Password",
                      })}
                    </InputLabel>
                    <TextField
                      {...field}
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      variant="outlined"
                      size="small"
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      fullWidth
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPassword}
                              onMouseDown={handleMouseDownPassword}
                              edge="end"
                            >
                              {showPassword ? <EyeSlash /> : <Eye />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                );
              }}
            />
            <Button type="submit" variant="contained" fullWidth size="small">
              {intl.formatMessage(
                {
                  id: "signup.button.submit",
                  defaultMessage:
                    "{isLoading, plural, one {Loading...} other {Sign up} }",
                },
                { isLoading: Number(!!(isLoading || logingIn)) }
              )}
            </Button>
            <Box textAlign="center">
              <Link
                sx={{ cursor: "pointer" }}
                onClick={() => navigate(paths.login)}
              >
                Login
              </Link>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SignUp;
