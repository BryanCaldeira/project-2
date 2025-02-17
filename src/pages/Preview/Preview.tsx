import { BodyText, Display, Label } from "ui/Typography";
import { Box, Button, useTheme } from "@mui/material";
import {
  CaretRight,
  HandCoins,
} from "@phosphor-icons/react";
import {
  FormattedDate,
  FormattedMessage,
  FormattedNumber,
  useIntl,
} from "react-intl";
import {
  IPayrollResponse,
  ISeasonResponse,
} from "project-2-types/dist/interface";
import { PayrollPayload, createPayroll, getPayrollPreview } from "api/payroll";
import React, { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { styled, useMediaQuery } from "@mui/system";

import BasicHome from "layouts/BasicHome";
import DataTable from "ui/DataTable";
import { DatePicker } from "@mui/x-date-pickers";
import { GridColDef } from "@mui/x-data-grid";
import PayrollConfirmationModal from "components/payroll/PayrollConfirmationModal";
import PayrollDone from "components/payroll/PayrollDone";
import SeasonFilterDataGrid from "components/SeasonFilterDataGrid";
import endpoints from "api/endpoints";
import { useAlert } from "context/AlertProvider";
import { useMutation } from "react-query";
import { useSearchParams } from "react-router-dom";
import { useUser } from "context/UserProvider";

const columns = (currency: string, unit: string): GridColDef[] => [
  {
    field: "index",
    renderHeader: () => (
      <FormattedMessage
        id="payroll.preview.columns.no.header"
        defaultMessage="No."
      />
    ),
    align: "center",
    headerAlign: "center",
    disableColumnMenu: true,
    hideSortIcons: true,
    width: 80,
    valueGetter: (params) => {
      return params.row.index + 1;
    },
  },
  {
    field: "name",
    renderHeader: () => (
      <FormattedMessage
        id="payroll.preview.columns.picker.header"
        defaultMessage="Picker"
      />
    ),
    flex: 0.25,
    minWidth: 100,
    valueGetter: (params) => {
      return params.row.picker.name;
    },
  },
  {
    field: "grossAmount",
    renderHeader: () => (
      <FormattedMessage
        id="payroll.preview.columns.gross_pay.header"
        defaultMessage="Gross Pay {currency}"
        values={{ currency }}
      />
    ),
    headerAlign: "right",
    align: "right",
    flex: 0.25,
    renderCell: (params) => {
      return (
        <FormattedNumber
          value={params.row.grossAmount}
          minimumFractionDigits={2}
        />
      );
    },
  },
  {
    field: "collectedAmount",
    renderHeader: () => (
      <FormattedMessage
        id="payroll.preview.columns.harvest_amount.header"
        defaultMessage="Harvest Amount"
      />
    ),
    flex: 0.25,
    headerAlign: "right",
    align: "right",
    renderCell: (params) => {
      return (
        <span>
          <FormattedNumber value={params.row.collectedAmount} /> {unit}
        </span>
      );
    },
  },
  {
    field: "deductions",
    renderHeader: () => (
      <FormattedMessage
        id="payroll.preview.columns.deductions.header"
        defaultMessage="Deductions {currency}"
        values={{ currency }}
      />
    ),
    flex: 0.25,
    headerAlign: "right",
    align: "right",
    renderCell: (params) => {
      return (
        <FormattedNumber
          value={params.row.deductions}
          minimumFractionDigits={2}
        />
      );
    },
  },
  {
    field: "netAmount",
    renderHeader: () => (
      <Box paddingRight={4}>
        <FormattedMessage
          id="payroll.preview.columns.net_pay.header"
          defaultMessage="Net Pay {currency}"
          values={{ currency }}
        />
      </Box>
    ),
    headerAlign: "right",
    align: "right",
    flex: 0.25,
    renderCell: (params) => {
      return (
        <Box paddingRight={4}>
          <FormattedNumber
            value={params.row.netAmount}
            minimumFractionDigits={2}
          />
        </Box>
      );
    },
  },
];

const Preview: React.FC = () => {
  const { user, defaultSeason } = useUser();
  const { showAlert } = useAlert();
  const [searchParams] = useSearchParams();
  const defaultSeasonId = searchParams.get("seasonId");

  const intl = useIntl();

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));

  const [payrollData, setPayrollData] = useState<IPayrollResponse | null>(null);

  const [startDate, setStartDate] = useState<Dayjs>();
  const [endDate, setEndDate] = useState<Dayjs>();

  const [selectedSeason, setSelectedSeason] = useState<
    ISeasonResponse | undefined
  >({
    _id: defaultSeason,
  } as any);

  const [payrollDone, setPayrollDone] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState(false);

  const { mutate: getPreview } = useMutation({
    mutationKey: [endpoints.payrolls, "preview"],
    mutationFn: getPayrollPreview,
    onSuccess: (data: any) => {
      setPayrollData(data);

      !startDate && setStartDate(dayjs(data?.nextEstimatedPayroll.startDate));
      !endDate && setEndDate(dayjs(data?.nextEstimatedPayroll.endDate));
    },
    onError: () => {
      showAlert(
        intl.formatMessage({
          id: "payroll.preview.get.error",
          defaultMessage: "Oops! Preview is not available.",
        }),
        "error"
      );
    },
  });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = async () => {
    try {
      if (!selectedSeason?._id || !payrollData || !startDate || !endDate) {
        return;
      }
      setIsLoading(true);

      const payload: PayrollPayload = {
        farmId: user.farm._id,
        seasonId: selectedSeason?._id,
        endDate: endDate.valueOf(),
        startDate: startDate.valueOf(),
        totals: {
          totalGrossAmount: payrollData?.totals.grossAmount,
          totalCollectedAmount: payrollData?.totals.collectedAmount,
          totalDeductions: payrollData?.totals.deductions,
        },
      };

      await createPayroll(payload);
      setPayrollDone(true);
      setOpen(false);
    } catch (error) {
      console.log(error);
      showAlert(
        intl.formatMessage({
          id: "payroll.preview.run.error",
          defaultMessage: "Oops! Payroll could not be saved.",
        }),
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSeason?._id) {
      getPreview({
        endDate: endDate ? endDate.toDate().getTime() : undefined,
        startDate: startDate ? startDate.toDate().getTime() : undefined,
        farmId: user.farm._id,
        seasonId: selectedSeason?._id,
      });
    }
  }, [endDate, selectedSeason?._id]);

  return (
    <BasicHome
      title={intl.formatMessage({
        id: "Start Payroll",
        defaultMessage: "Start Payroll",
      })}
      breadcrumb={[
        { title: user.farm.name, href: "/" },
        {
          title: (
            <FormattedMessage id="sidebar.payroll" defaultMessage="Payroll" />
          ),
          href: "/payroll",
        },
        {
          title: (
            <FormattedMessage
              id="breadcrumb.run_payroll"
              defaultMessage="Run Payroll"
            />
          ),
          href: "",
        },
      ]}
    >
      {!!payrollDone && (
        <Box display="flex" flexDirection="column" gap="3rem" pb="2rem">
          <PayrollDone />
          <PayrollTotals className="totals-container">
            <Card>
              <Label
                size="sm"
                fontWeight="SemiBold"
                tabIndex={0}
                arial-label={`Pay period from ${intl.formatDate(
                  startDate?.toDate(),
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                )} to ${intl.formatDate(endDate?.toDate(), {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })} `}
              >
                Pay Period
              </Label>
              <Display
                aria-hidden
                size="xs"
                fontWeight="SemiBold"
                display="flex"
                gap={1}
              >
                <Box aria-hidden>
                  <FormattedDate
                    value={startDate?.toDate()}
                    month="short"
                    day="numeric"
                  />
                </Box>
                <Box aria-hidden>-</Box>
                <Box aria-hidden>
                  <FormattedDate
                    value={endDate?.toDate()}
                    month="short"
                    day="numeric"
                  />
                </Box>
              </Display>
            </Card>
            <Card>
              <Label size="sm" fontWeight="SemiBold">
                Total Net Pay
              </Label>
              <Display size="xs" fontWeight="SemiBold">
                {payrollData?.totals?.netAmount}
              </Display>
            </Card>
            <Card>
              <Label size="sm" fontWeight="SemiBold">
                Total Harvest Amount
              </Label>
              <Display size="xs" fontWeight="SemiBold">
                {payrollData?.totals.collectedAmount}{" "}
                {payrollData?.season?.unit}
              </Display>
            </Card>
            <Card>
              <Label size="sm" fontWeight="SemiBold">
                Total Deductions
              </Label>
              <Display size="xs" fontWeight="SemiBold">
                {payrollData?.totals.deductions}
              </Display>
            </Card>
          </PayrollTotals>
        </Box>
      )}

      {!payrollDone && (
        <PayrollFilters>
          <div className="filter-container">
            <div className="date-filter">
              <BodyText size="md" sx={{ flexShrink: 0 }}>
                {intl.formatMessage({
                  id: "preview.active.season",
                  defaultMessage: "Active Season",
                })}
              </BodyText>
              <SeasonFilterDataGrid
                onChange={setSelectedSeason}
                status="ACTIVE"
                sx={{ width: !desktop ? "100%" : undefined }}
                defaultFirst={false}
                defaultSeasonId={defaultSeasonId}
              />
            </div>
            <div className="filters">
              <div className="date-filter">
                <BodyText size="md">
                  {intl.formatMessage({
                    id: "payroll.preview.from",
                    defaultMessage: "From",
                  })}
                </BodyText>
                <DatePicker
                  value={startDate}
                  slotProps={{
                    textField: { size: "small", fullWidth: true },
                  }}
                  onChange={(value) => {
                    if (value) {
                      setStartDate(value);
                    }
                  }}
                />
              </div>
              <div className="date-filter">
                <BodyText size="md">
                  {intl.formatMessage({
                    id: "payroll.preview.to",
                    defaultMessage: "to",
                  })}
                </BodyText>
                <DatePicker
                  value={endDate}
                  slotProps={{
                    textField: { size: "small", fullWidth: true },
                  }}
                  onChange={(value) => {
                    if (value) {
                      setEndDate(value);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <PayrollTotals className="totals-container">
            <Card>
              <Label
                size="sm"
                fontWeight="SemiBold"
                tabIndex={0}
                arial-label={`Pay period from ${intl.formatDate(
                  startDate?.toDate(),
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                )} to ${intl.formatDate(endDate?.toDate(), {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })} `}
              >
                {intl.formatMessage({
                  id: "payroll.preview.pay_period",
                  defaultMessage: "Pay Period",
                })}
              </Label>
              <Display
                aria-hidden
                size="xs"
                fontWeight="SemiBold"
                display="flex"
                gap={1}
              >
                <Box aria-hidden>
                  <FormattedDate
                    value={startDate?.toDate()}
                    month="short"
                    day="numeric"
                  />
                </Box>
                <Box aria-hidden>-</Box>
                <Box aria-hidden>
                  <FormattedDate
                    value={endDate?.toDate()}
                    month="short"
                    day="numeric"
                  />
                </Box>
              </Display>
            </Card>
            <Card>
              <Label size="sm" fontWeight="SemiBold">
                {intl.formatMessage({
                  id: "payroll.preview.total_net_pay",
                  defaultMessage: "Total Net Pay",
                })}
              </Label>
              <Display size="xs" fontWeight="SemiBold">
                <FormattedNumber
                  value={payrollData?.totals?.netAmount ?? 0}
                  minimumFractionDigits={2}
                />
              </Display>
            </Card>
            <Card>
              <Label size="sm" fontWeight="SemiBold">
                {intl.formatMessage({
                  id: "payroll.preview.total_harvest_amount",
                  defaultMessage: "Total Harvest Amount",
                })}
              </Label>
              <Display size="xs" fontWeight="SemiBold">
                {payrollData?.totals.collectedAmount}{" "}
                {payrollData?.season?.unit}
              </Display>
            </Card>
            <Card>
              <Label size="sm" fontWeight="SemiBold">
                {intl.formatMessage({
                  id: "payroll.preview.total_deductions",
                  defaultMessage: "Total Deductions",
                })}
              </Label>
              <Display size="xs" fontWeight="SemiBold">
                {payrollData?.totals.deductions}
              </Display>
            </Card>
          </PayrollTotals>

          <Button
            variant="contained"
            color="primary"
            sx={{ width: "min-content" }}
            onClick={handleClickOpen}
            disabled={!payrollData?.details?.length}
            className="run-payroll-button"
            endIcon={<CaretRight size={20} />}
          >
            {intl.formatMessage({
              id: "payroll.preview.run_payroll",
              defaultMessage: "Run Payroll",
            })}
          </Button>
        </PayrollFilters>
      )}

      {/* Payroll Confirmation Modal */}
      <PayrollConfirmationModal
        open={open}
        onClose={handleClose}
        onCancel={handleClose}
        isLoading={isLoading}
        data={{
          seasonName: payrollData?.season.name,
          startDate: startDate?.toDate(),
          endDate: endDate?.toDate(),
          netAmount: payrollData?.totals.netAmount,
          currency: payrollData?.season.currency,
        }}
        onConfirm={handleConfirm}
      />

      <Box
        display="flex"
        flexDirection="column"
        gap="1.5rem"
        flex={1}
        pb={3}
        height="100%"
      >
        <Display size="xs" fontWeight="SemiBold">
          {intl.formatMessage({
            id: "payroll.preview.details.title",
            defaultMessage: "Payroll Details",
          })}
        </Display>
        <DataTable
          initialState={{
            columns: {
              columnVisibilityModel: {
                index: !!desktop,
                grossAmount: !!desktop,
                collectedAmount: !!desktop,
                deductions: !!desktop,
              },
            },
          }}
          emptyState={{
            icon: <HandCoins width="100%" height="100%" />,
            title: intl.formatMessage({
              id: "payroll.preview.empty.state.title",
              defaultMessage: `It seems you don't have harvest entries to settle.`,
            }),
            subtitle: intl.formatMessage({
              id: "payroll.preview.empty.state.subtitle",
              defaultMessage: `Make sure the filters set are correct.`,
            }),
          }}
          rows={payrollData?.details ?? []}
          columns={columns(
            payrollData?.season?.currency ?? "",
            payrollData?.season?.unit ?? ""
          )}
          disableRowSelectionOnClick
          getRowId={(row) => row?.picker?.id}
        />
      </Box>
    </BasicHome>
  );
};

const Card = styled(Box)`
  background-color: ${({ theme }) => theme.palette.grey[50]};
  padding: ${({ theme }) => theme.spacing(3)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.75)};
  border-radius: 0.5rem;
  flex: 1;
`;

const PayrollTotals = styled(Box)`
  display: grid;
  grid-template-columns: repeat(2, 1fr);

  gap: ${({ theme }) => theme.spacing(2)};
  ${(props) => props.theme.breakpoints.up("md")} {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const PayrollFilters = styled(Box)`
  // Mobile
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};

  .filter-container {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(1)};

    .filters {
      display: flex;
      flex-direction: row;
      width: 100%;
      gap: ${({ theme }) => theme.spacing(2)};

      .date-filter {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: ${({ theme }) => theme.spacing(0.5)};
      }
    }
  }

  // Desktop
  ${(props) => props.theme.breakpoints.up("md")} {
    display: grid;
    grid-template-columns: auto 10rem;

    .filter-container {
      grid-column: 1;
      display: flex;
      align-items: center;
      flex-direction: row;

      .filters {
        width: fit-content;
      }

      .date-filter {
        display: flex;
        width: fit-content;
        flex-direction: row !important;
        align-items: center;
        gap: ${({ theme }) => theme.spacing(1.25)} !important;
      }
    }

    .totals-container {
      grid-column: 1/-1;
      grid-row: 2;
    }

    .run-payroll-button {
      grid-column: 2;
    }
  }
`;

export default Preview;
