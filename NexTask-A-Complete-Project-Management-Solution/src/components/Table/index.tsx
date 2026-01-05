import React, { useEffect, useState } from 'react';
import {
  useTheme,
  Table as MuiTable,
  List as MuiList,
  useMediaQuery,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Box,
  Typography,
  ListItem,
  ListItemText,
  Link,
  Stack,
  Pagination,
  Skeleton,
} from '@mui/material';
import { usePathname } from 'next/navigation';
import NextLink from 'next/link';
import Image from 'next/image';

// Type definitions for columns, list keys, and props
interface Column {
  key: string;
  title: string;
  align?: 'left' | 'center' | 'right';
  render?: (data: any) => React.ReactNode;
}

interface ListKeys {
  primaryLinkKey?: string;
  primaryKeys: string[];
  secondaryKeys: string[];
}

interface ResponsiveTableProps {
  columns: Column[];
  loading?: boolean;
  data: any[];
  listKeys: ListKeys;
  renderActions?: (item: any) => React.ReactNode | undefined;
}

interface TableProps {
  data: any[];
  loading?: boolean;
  columns: Column[];
  renderActions?: (item: any) => React.ReactNode | undefined;
}

interface ListProps {
  data: any[];
  loading?: boolean;
  listKeys: ListKeys;
  renderActions?: (item: any) => React.ReactNode | undefined;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  data,
  listKeys,
  renderActions,
  loading,
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [page, setPage] = useState<number>(0);
  const [listPage, setListPage] = useState<number>(1);
  const [dataSource, setDataSource] = useState<any[]>(data);

  useEffect(() => {
    setDataSource(data.slice(page * rowsPerPage, (page + 1) * rowsPerPage));
  }, [page, rowsPerPage, data]);

  // Handle pagination for table view
  const handleChangePage = (
    _: React.MouseEvent<HTMLButtonElement, MouseEvent> | any,
    newPage: number
  ) => {
    setPage(newPage);
    setDataSource(data.slice(newPage * rowsPerPage, (newPage + 1) * rowsPerPage));
  };

  // Handle pagination for list view
  const handleChangeListPage = (
    _: React.MouseEvent<HTMLButtonElement, MouseEvent> | any,
    newPage: number
  ) => {
    setListPage(newPage);
    const dataIndex = newPage - 1;
    setDataSource(data.slice(dataIndex * rowsPerPage, (dataIndex + 1) * rowsPerPage));
  };

  // Handle changing the number of rows per page
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    setDataSource(data.slice(0, newRowsPerPage));
  };

  return (
    <TableContainer>
      {isSmallScreen ? (
        <List
          data={dataSource}
          listKeys={listKeys}
          renderActions={renderActions}
          loading={loading}
        />
      ) : (
        <Table
          data={dataSource}
          columns={columns}
          renderActions={renderActions}
          loading={loading}
        />
      )}
      {isSmallScreen ? (
        <Pagination
          count={Math.ceil(data.length / rowsPerPage)}
          page={listPage}
          onChange={handleChangeListPage}
          size="small"
          color="primary"
        />
      ) : (
        <TablePagination
          rowsPerPageOptions={[5, 10]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </TableContainer>
  );
};

const Table: React.FC<TableProps> = ({ loading, data, columns, renderActions }) => {
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<string>(columns[0]?.key || '');

  const getComparator = (order: 'asc' | 'desc', orderBy: string) => {
    return order === 'desc'
      ? (a: any, b: any) => (b[orderBy] < a[orderBy] ? -1 : 1)
      : (a: any, b: any) => (a[orderBy] < b[orderBy] ? -1 : 1);
  };

  const handleSortRequest = (property: string) => {
    const isAscending = orderBy === property && order === 'asc';
    setOrder(isAscending ? 'desc' : 'asc');
    setOrderBy(property);
  };

  return (
    <TableContainer component={Box}>
      <>
        {loading ? (
          <MuiTable>
            <TableHead>
              <TableRow>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableCell key={index}>
                    <Skeleton variant="rectangular" />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Array.from({ length: 5 }).map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton variant="text" height={24} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </MuiTable>
        ) : (
          <MuiTable aria-label="responsive-table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.key} align={column.align}>
                    <TableSortLabel
                      active={orderBy === column.key}
                      direction={orderBy === column.key ? order : 'asc'}
                      onClick={() => handleSortRequest(column.key)}
                    >
                      {column.title}
                    </TableSortLabel>
                  </TableCell>
                ))}
                {renderActions && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              <>
                {data.length ? (
                  data
                    .slice()
                    .sort(getComparator(order, orderBy))
                    .map((item) => (
                      <TableRow key={item.id} suppressHydrationWarning>
                        {columns.map(({ key, align, render }) => (
                          <TableCell key={key} align={align} suppressHydrationWarning>
                            {render ? render(item) : item[key]}
                          </TableCell>
                        ))}
                        {renderActions && (
                          <TableCell align="center">{renderActions(item)}</TableCell>
                        )}
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={renderActions ? columns.length + 1 : columns.length}
                      align="center"
                    >
                      <Box>
                        <div>
                          <Image
                            src={'/images/no-data.png'}
                            alt="not-found"
                            width={2000}
                            height={100}
                            style={{
                              width: '100%',
                              height: '100%',
                              maxWidth: '40%',
                            }}
                          />
                        </div>
                        <Typography gutterBottom>No records found</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </>
            </TableBody>
          </MuiTable>
        )}
      </>
    </TableContainer>
  );
};

const List: React.FC<ListProps> = ({ loading, data, listKeys, renderActions }) => {
  const pathname = usePathname();
  const { primaryKeys, primaryLinkKey, secondaryKeys } = listKeys;

  return (
    <MuiList>
      <>
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={<Skeleton variant="text" width="80%" />}
                secondary={<Skeleton variant="text" width="60%" />}
              />
            </ListItem>
          ))
        ) : (
          <>
            {data.length ? (
              data.map((item) => (
                <ListItem key={item.id} divider sx={{ pl: 0, pr: 0 }}>
                  <ListItemText
                    primaryTypographyProps={{ gutterBottom: true }}
                    primary={
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1}>
                          {primaryLinkKey && (
                            <Link
                              component={NextLink}
                              href={`/${pathname}/${item[primaryLinkKey]}`}
                              color="info"
                            >
                              {item[primaryLinkKey]}
                            </Link>
                          )}
                          {primaryKeys.map(
                            (key) => item[key] && <Typography key={key}>{item[key]}</Typography>
                          )}
                        </Stack>
                        <Stack direction="row" alignItems="center">
                          {renderActions && renderActions(item)}
                        </Stack>
                      </Stack>
                    }
                    secondary={
                      <Stack direction="column" spacing={0} sx={{ mb: 0.8 }}>
                        {secondaryKeys.map((key) =>
                          item[key] ? (
                            <Typography key={key} variant="caption">
                              {item[key]}
                            </Typography>
                          ) : null
                        )}
                      </Stack>
                    }
                  />
                </ListItem>
              ))
            ) : (
              <Box textAlign={'center'}>
                <Image
                  src={'/images/no-data.png'}
                  alt="not-found"
                  width={2000}
                  height={100}
                  style={{ width: '100%', height: '100%', maxWidth: '40%' }}
                />
                <Typography gutterBottom>No records found</Typography>
              </Box>
            )}
          </>
        )}
      </>
    </MuiList>
  );
};

export default ResponsiveTable;
