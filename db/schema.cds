namespace com.gov.librarymanagement;

using { cuid, managed } from '@sap/cds/common';

entity Genres : cuid, managed {
  name         : String(100);
  description  : String(500);
  books        : Association to many Books on books.genre = $self; 
}

entity Books : cuid, managed {
  title            : String(150);
  author           : String(100);
  publisher        : String(100);
  edition          : String(50);
  year             : Integer;
  genre            : Association to Genres;
  totalCopies      : Integer;
  @readonly availableCopies  : Integer;
  description      : String(1000);
  copies           : Association to many BookCopies on copies.book = $self;
}

entity BookCopies : cuid, managed {
  book             : Association to Books;
  copyNumber       : Integer;
  status           : String enum { AVAILABLE; BORROWED; DAMAGED };
}

@assert.unique.email: [email]
entity Members : cuid, managed {
  firstName        : String(100);
  lastName         : String(100);
  email            : String(100);
  phone            : String(20);
  address          : String(500);
  membershipDate   : Date;
  isActive         : Boolean default true;
  borrowings       : Association to many BorrowingInfo on borrowings.member = $self;
}

entity BorrowingInfo : cuid, managed {
  member           : Association to Members;
  bookCopy         : Association to BookCopies;
  borrowDate       : Date;
  dueDate          : Date;
  returnDate       : Date;
  status           : String enum { BORROWED; RETURNED; OVERDUE };
}