# MSU Dashboard Local Display Test

Chrome / Edge Manifest V3 extension for experimenting with the **visible display only** of dashboard fee figures. It does not alter any university records or payment status.

## Example

- Total paid: Ksh. 186,100 (read from the dashboard)
- Total billed: Ksh. 179,100 (paid - Ksh. 7,000)
- Displayed balance: Ksh. +7,000

When enabled, the extension adds a visible **LOCAL TEST VIEW — NOT OFFICIAL RECORDS** indicator so the edited figures cannot be confused with university-issued balances.

## Install

1. Download the repository (Code > Download ZIP) and extract it.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select the extracted directory containing `manifest.json`.
5. Open or refresh `https://student.maseno.ac.ke/pages/Dashboard`.

To restore the original on-screen data, disable the extension and refresh the page. No university account records are changed.
