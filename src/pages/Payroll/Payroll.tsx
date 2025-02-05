import { Box, Button, useMediaQuery, useTheme } from "@mui/material";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { CaretRight, HandCoins, User } from "@phosphor-icons/react";
import { getPayrollHistory } from "api/payroll";
import SeasonFilterDataGrid from "components/SeasonFilterDataGrid";
import { useAlert } from "context/AlertProvider";
import { useUser } from "context/UserProvider";
import useQueryCache from "hooks/useQueryCache";
import BasicHome from "layouts/BasicHome";
import { ISeasonResponse } from "project-2-types/dist/interface";
import { useState } from "react";
import {
  FormattedDate,
  FormattedMessage,
  FormattedNumber,
  useIntl,
} from "react-intl";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import DataTable from "ui/DataTable";
import { Display } from "ui/Typography";

const columns = (currency: string): GridColDef[] => [
  {
    field: "period",
    renderHeader: () => (
      <FormattedMessage
        id="payroll.history.columns.pay_period.header"
        defaultMessage="Pay Period"
      />
    ),
    disableColumnMenu: true,
    flex: 0.25,
    minWidth: 100,
    renderCell: (params: GridRenderCellParams) => {
      return (
        <span>
          <FormattedDate
            value={params.row.startDate}
            month="short"
            day="numeric"
          />
          -
          <FormattedDate
            value={params.row.endDate}
            month="short"
            day="numeric"
          />
        </span>
      );
    },
  },
  {
    field: "netAmount",
    flex: 0.25,
    renderHeader: () => (
      <FormattedMessage
        id="payroll.history.columns.net_pay.header"
        defaultMessage="Total net pay {currency}"
        values={{ currency: currency ? `(${currency})` : "" }}
      />
    ),
    headerAlign: "right",
    align: "right",
    renderCell: (params) => (
      <FormattedNumber
        value={params.row.totals.netAmount}
        minimumFractionDigits={2}
      />
    ),
  },
  {
    field: "collectedAmount",
    renderHeader: () => (
      <FormattedMessage
        id="payroll.history.columns.harvest_amount.header"
        defaultMessage="Harvest Amount"
      />
    ),
    headerAlign: "right",
    align: "right",
    flex: 0.25,
    renderCell: (params) => (
      <Box display="flex" gap={0.88} paddingLeft="3rem">
        <FormattedNumber value={params.row.totals.collectedAmount} />
        {params.row.season.unit}
      </Box>
    ),
  },
  {
    field: "deductions",
    renderHeader: () => (
      <FormattedMessage
        id="payroll.history.columns.deductions.header"
        defaultMessage="Deductions {currency}"
        values={{ currency }}
      />
    ),
    flex: 0.25,
    headerAlign: "right",
    align: "right",
    renderCell: (params) => (
      <FormattedNumber
        value={params.row.totals.deductions}
        minimumFractionDigits={2}
      />
    ),
  },
  {
    field: "pickersCount",
    headerAlign: "center",
    renderHeader: () => (
      <FormattedMessage
        id="payroll.history.columns.pickers.header"
        defaultMessage="Pickers"
      />
    ),
    flex: 0.25,
    renderCell: (params) => (
      <Box display="flex" gap={0.88} paddingLeft="3rem">
        <User size="1.25rem" />
        <FormattedNumber value={params.row.pickersCount} />
      </Box>
    ),
  },
  {
    field: "createdAt",
    renderHeader: () => (
      <FormattedMessage
        id="payroll.history.columns.pay_date.header"
        defaultMessage="Pay Date"
      />
    ),
    flex: 0.25,
    renderCell: (params) => (
      <FormattedDate value={params.value} month="short" day="2-digit" />
    ),
  },
  // {
  //   field: "actions",
  //   renderHeader: () => (
  //     <FormattedMessage id="datagrid.column.actions" defaultMessage="Actions" />
  //   ),
  //   headerAlign: "center",
  //   align: "center",
  //   width: 150,
  //   flex: 0.15,
  //   sortable: false,
  //   disableColumnMenu: true,
  //   renderCell: () => <ViewMoreButton />,
  // },
  // TODO: hide temporarily
];

const Payroll = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const intl = useIntl();
  const { showAlert } = useAlert();

  const theme = useTheme();
  const tablet = useMediaQuery(theme.breakpoints.up("sm"));

  const { GET_QUERY_KEY } = useQueryCache("payrolls");

  const [payrollData, setPayrollData] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState<ISeasonResponse>();
  const [isSeasonsFetch, setSeasonsFetch] = useState<boolean>(false);

  const { isLoading } = useQuery({
    queryKey: [...GET_QUERY_KEY, selectedSeason?._id],
    queryFn: () => getPayrollHistory({ seasonId: selectedSeason?._id }),
    enabled: !!selectedSeason?._id || isSeasonsFetch,
    onSuccess: (results) => {
      setPayrollData(results);
    },
    onError: (error) => {
      console.log(error);
      showAlert(
        intl.formatMessage({
          id: "payroll.get.payroll.history.error",
          defaultMessage: "No payroll history found",
        }),
        "error"
      );
    },
  });

  return (
    <BasicHome
      title={intl.formatMessage({ id: "payrolls", defaultMessage: "Payroll" })}
      subtitle={intl.formatMessage({
        id: "payrolls.subtitle",
        defaultMessage:
          "Create the payrolls and view previous payroll records.",
      })}
      breadcrumb={[
        { title: user.farm.name, href: "/" },
        {
          title: (
            <FormattedMessage id="sidebar.payroll" defaultMessage="Payrolls" />
          ),
          href: "",
        },
      ]}
      actions={
        <Button
          variant="contained"
          onClick={() =>
            navigate(`/payroll/preview?seasonId=${selectedSeason?._id}`)
          }
          size="medium"
          endIcon={<CaretRight size={20} />}
        >
          {intl.formatMessage({
            id: "paryroll.start.payroll.button",
            defaultMessage: "Start payroll",
          })}
        </Button>
      }
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap="1rem"
      >
        <Display component="h2" size="xs" fontWeight="SemiBold">
          {intl.formatMessage({
            id: "payroll.payroll.history.title",
            defaultMessage: "Payroll History",
          })}
        </Display>
        <SeasonFilterDataGrid
          onChange={setSelectedSeason}
          onFetch={() => setSeasonsFetch(true)}
          defaultFirst={false}
        />
      </Box>
      <Box display="flex" flexGrow={1} pb={3}>
        <DataTable
          rows={payrollData}
          columns={columns(selectedSeason?.currency.name ?? "")}
          loading={isLoading}
          emptyState={{
            icon: <HandCoins width="100%" height="100%" />,
            title: intl.formatMessage({
              id: "payroll.empty.state.subtitle",
              defaultMessage: `It seems  you don’t have any payroll history yet.`,
            }),
          }}
          initialState={{
            columns: {
              columnVisibilityModel: {
                createdAt: !!tablet,
                collectedAmount: !!tablet,
                deductions: !!tablet,
                pickersCount: !!tablet,
              },
            },
          }}
          getRowId={(data) => data?._id}
          disableRowSelectionOnClick
        />
      </Box>
    </BasicHome>
  );
};

export default Payroll;
