import { DatePipe } from '@angular/common';
import { nonSortableColumns } from './../../models/non-sortable-columns.model';
import { AdminTableService } from '../../services/admin-table.service';
import { CdkDragDrop, CdkDragStart, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { ubsAdminTable } from '../ubs-image-pathes/ubs-admin-table';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-ubs-admin-table',
  templateUrl: './ubs-admin-table.component.html',
  styleUrls: ['./ubs-admin-table.component.scss']
})
export class UbsAdminTableComponent implements OnInit, OnDestroy {
  nonSortableColumns = nonSortableColumns;
  sortingColumn: string;
  sortType: string;
  columns: any[] = [];
  displayedColumns: string[] = [];
  orderInfo: string[] = [];
  customerInfo: string[] = [];
  orderDetails: string[] = [];
  sertificate: string[] = [];
  detailsOfExport: string[] = [];
  responsiblePerson: string[] = [];
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  arrayOfHeaders = [];
  previousIndex: number;
  isLoading = true;
  isUpdate = false;
  destroy: Subject<boolean> = new Subject<boolean>();
  arrowDirection: string;
  tableData: any[];
  totalPages: number;
  pageSizeOptions: number[] = [10, 15, 20];
  currentPage = 0;
  pageSize = 10;
  ubsAdminTableIcons = ubsAdminTable;
  usedFilter: string = '';
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(private adminTableService: AdminTableService, private datePipe: DatePipe) {}

  ngOnInit() {
    this.getTable();
  }

  applyFilter(filterValue: string): void {
    this.usedFilter = filterValue.trim().toLowerCase();
    this.dataSource.filter = this.usedFilter;
    if (this.dataSource.filteredData.length < this.pageSize) {
      this.onScroll();
    }
  }

  setDisplayedColumns() {
    this.columns.forEach((colunm, index) => {
      colunm.index = index;
      this.displayedColumns[index] = colunm.field;
    });
  }

  dropListDropped(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.displayedColumns, event.previousIndex, event.currentIndex);
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.orderId + 1}`;
  }

  showAllColumns(): void {
    this.getTable();
    this.applyFilter(this.usedFilter);
  }

  changeColumns(field: string, i: number) {
    const beforeColumnsLength = this.columns.length;
    this.columns = this.columns.filter((el) => el.field !== field);
    const afterColumnsLength = this.columns.length;
    const requiredFieldValues = ['orderid', 'order_status', 'order_date'];
    if (beforeColumnsLength === afterColumnsLength) {
      const newObjectForHeader = {
        field,
        sticky: this.isPropertyRequired(field, requiredFieldValues),
        index: i
      };
      this.columns = [...this.columns.slice(0, i), newObjectForHeader, ...this.columns.slice(i, this.columns.length)];
      this.setDisplayedColumns();
    } else {
      this.setDisplayedColumns();
    }
  }

  getTable(columnName = this.sortingColumn || 'orderid', sortingType = this.sortType || 'desc') {
    this.isLoading = true;
    this.adminTableService
      .getTable(columnName, this.currentPage, this.pageSize, sortingType)
      .pipe(takeUntil(this.destroy))
      .subscribe((item) => {
        this.tableData = item[`page`];
        this.tableData = this.transformDatebyPipe(this.tableData);
        this.totalPages = item[`totalPages`];
        this.dataSource = new MatTableDataSource(this.tableData);
        const requiredColumns = [{ field: 'select', sticky: true }];
        const dynamicallyColumns = [];
        const arrayOfProperties = Object.keys(this.tableData[0]);
        arrayOfProperties.forEach((property) => {
          const requiredFieldValues = ['orderid', 'order_status', 'order_date'];
          const objectOfValue = {
            field: property,
            sticky: this.isPropertyRequired(property, requiredFieldValues)
          };
          dynamicallyColumns.push(objectOfValue);
        });
        this.columns = [].concat(requiredColumns, dynamicallyColumns);
        this.setDisplayedColumns();
        this.isLoading = false;
        this.arrayOfHeaders = dynamicallyColumns;
        this.orderInfo = dynamicallyColumns.slice(0, 3);
        this.customerInfo = dynamicallyColumns.slice(3, 10);
        this.orderDetails = dynamicallyColumns.slice(10, 18);
        this.sertificate = dynamicallyColumns.slice(18, 22);
        this.detailsOfExport = dynamicallyColumns.slice(22, 27);
        this.responsiblePerson = dynamicallyColumns.slice(27, 33);
        this.applyFilter(this.usedFilter);
      });
  }

  private isPropertyRequired(field: string, requiredFields: string[]) {
    return requiredFields.some((reqField) => field === reqField);
  }

  updateTableData() {
    this.isUpdate = true;
    this.adminTableService
      .getTable(this.sortingColumn || 'orderid', this.currentPage, this.pageSize, this.sortType || 'desc')
      .pipe(takeUntil(this.destroy))
      .subscribe((item) => {
        let data = item[`page`];
        data = this.transformDatebyPipe(data);
        this.totalPages = item[`totalPages`];
        this.tableData = [...this.tableData, ...data];
        this.dataSource.data = this.tableData;
        this.isUpdate = false;
        this.applyFilter(this.usedFilter);
      });
  }

  transformDatebyPipe(dataOnPage) {
    const modifiedData = dataOnPage.map((data) => {
      return {
        ...data,
        order_date: this.datePipe.transform(data['order_date'], 'dd/MM/yyyy'),
        date_of_export: this.datePipe.transform(data['date_of_export'], 'dd/MM/yyyy')
      };
    });
    return modifiedData;
  }

  getSortingData(columnName, sortingType) {
    this.sortingColumn = columnName;
    this.sortType = sortingType;
    this.arrowDirection = this.arrowDirection === columnName ? null : columnName;
    this.currentPage = 0;
    this.getTable(columnName, sortingType);
  }

  selectPageSize(value: number) {
    this.pageSize = value;
  }

  onScroll() {
    if (!this.isUpdate && this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateTableData();
    }
  }

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.unsubscribe();
  }
}
