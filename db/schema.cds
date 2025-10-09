namespace com.gov.librarymanagement;

using { cuid , managed } from '@sap/cds/common';


entity Books : cuid , managed {
  title            : String;
  author           : String;
  isbn             : String(13);
  publisher        : String;
  edition          : String;
  year             : Integer;
  genre            : Association to Genres;
  totalCopies      : Integer;
  availableCopies  : Integer;
  description      : String;
  copies           : Composition of many BookCopies on copies.book = $self;
}

entity BookCopies : cuid , managed {
  book             : Association to Books;
  copyNumber       : Integer;
  status           : String enum { AVAILABLE; BORROWED; DAMAGED };
}

entity Genres : cuid, managed {
  name         : String;
  description  : String;
  books        : Composition of many Books on books.genre = $self;
}

entity Members :cuid , managed {
  memberID         : String(10);
  firstName        : String;
  lastName         : String;
  email            : String;
  phone            : String;
  address          : String;
  membershipDate   : Date;
  isActive         : Boolean default true;
  borrowings       : Composition of many BorrowingInfo on borrowings.member = $self;
}

entity BorrowingInfo : cuid , managed {
  member           : Association to Members;
  bookCopy         : Association to BookCopies;
  borrowDate       : Date;
  dueDate          : Date;
  returnDate       : Date;
  status           : String enum { BORROWED ; RETURNED ; OVERDUE };
}





