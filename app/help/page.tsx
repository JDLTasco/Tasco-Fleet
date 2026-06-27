export default function HelpPage() {
  const sectionStyle = {
    background: "#f8fafd", border: "1px solid #dce6f5",
    borderRadius: 8, padding: "20px 24px", marginBottom: 20,
  };
  const h2Style = {
    color: "#1B3A6B", fontSize: 17, margin: "0 0 14px",
    borderBottom: "2px solid #dce6f5", paddingBottom: 8,
  };
  const h3Style = { color: "#1B3A6B", fontSize: 14, margin: "16px 0 6px" };
  const li = { marginBottom: 6, fontSize: 14, lineHeight: 1.6 };
  const note = {
    background: "#fff8e1", border: "1px solid #ffe082",
    borderRadius: 5, padding: "8px 12px", fontSize: 13, margin: "10px 0",
  };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ background: "#1B3A6B", color: "#fff", padding: "20px 24px", borderRadius: 10, marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>How to Use — Tasco Fleet</h1>
        <p style={{ margin: "6px 0 0", fontSize: 14, opacity: 0.85 }}>Step-by-step guide for entering and amending data</p>
      </div>

      {/* LOGIN */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>Logging In &amp; Choosing a View</h2>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>Go to the app URL and enter username <strong>Tasco</strong> and password <strong>Tasco123</strong>, then click <strong>Log In</strong>.</li>
          <li style={li}>You will be asked to choose a view:
            <ul style={{ marginTop: 6 }}>
              <li style={li}><strong>Admin</strong> — see all vehicles across all depots. Use this for head office work.</li>
              <li style={li}><strong>Depot</strong> — select your depot from the dropdown, then click <strong>Enter as Depot</strong>. You will only see vehicles at your depot.</li>
            </ul>
          </li>
          <li style={li}>You can switch view at any time using the <strong>Switch View</strong> link in the top-right of the navigation bar.</li>
        </ol>
      </div>

      {/* VEHICLES */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>Vehicles</h2>

        <h3 style={h3Style}>Adding a New Vehicle</h3>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>Click <strong>Vehicles</strong> in the top navigation bar.</li>
          <li style={li}>Click the <strong>+ Add Vehicle</strong> button (top right).</li>
          <li style={li}>Fill in Fleet No, Vehicle Type, Make, Model, VIN, Depot, and Acquired Date.</li>
          <li style={li}>Click <strong>Save Vehicle</strong>. The vehicle will appear in the list immediately.</li>
        </ol>

        <h3 style={h3Style}>Filtering Vehicles</h3>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>Use the <strong>Search</strong> box to find by fleet no, make, model, or rego.</li>
          <li style={li}>Use the <strong>Vehicle Type</strong> dropdown to filter by type (Prime Mover, Trailer, etc.).</li>
          <li style={li}>In Admin mode, use the <strong>Depot</strong> dropdown to show one depot at a time.</li>
          <li style={li}>Use the <strong>Status</strong> dropdown to show Active, Archived, or All vehicles.</li>
          <li style={li}>Click <strong>Filter</strong> to apply, or <strong>Clear</strong> to reset.</li>
        </ol>

        <h3 style={h3Style}>Transferring a Vehicle to Another Depot</h3>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>In the vehicle list, find the vehicle row and click the <strong>Transfer</strong> dropdown in the Actions column.</li>
          <li style={li}>Select the destination depot from the list. The transfer is saved immediately and the vehicle moves to that depot.</li>
        </ol>

        <h3 style={h3Style}>Archiving or Restoring a Vehicle</h3>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>In the vehicle list, click the <strong>Archive</strong> button on the vehicle row. Confirm when prompted.</li>
          <li style={li}>To restore, set the Status filter to <strong>Archived</strong>, find the vehicle, and click <strong>Restore</strong>.</li>
        </ol>

        <h3 style={h3Style}>Editing Vehicle Details</h3>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>Click the vehicle's Fleet No (blue link) to open the Vehicle Detail page.</li>
          <li style={li}>Click into any field (Make, Model, Year, VIN, etc.) and type the new value.</li>
          <li style={li}>Click anywhere outside the field — it saves automatically. You will see <em>"Saved at …"</em> appear.</li>
        </ol>

        <h3 style={h3Style}>Amending Registration (Rego) Expiry</h3>
        <div style={note}>The previous rego expiry is automatically saved to history each time you amend it.</div>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>Open the Vehicle Detail page (click the Fleet No).</li>
          <li style={li}>In the <strong>Registration</strong> section, click <strong>Amend Rego</strong>.</li>
          <li style={li}>Enter the new Rego No, State, and Expiry Date. Add an optional note (e.g. "Renewed 12 months").</li>
          <li style={li}>Click <strong>Save Amendment</strong>. The current values are saved to history and the new values become current.</li>
          <li style={li}>Click <strong>Registration History</strong> to expand and view all past rego records.</li>
        </ol>

        <h3 style={h3Style}>Recording Kilometre Readings</h3>
        <div style={note}>Every KM reading is saved permanently. The vehicle's current KMs update automatically if the reading date is the most recent.</div>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>Open the Vehicle Detail page (click the Fleet No).</li>
          <li style={li}>In the <strong>Kilometres</strong> section, click <strong>+ Record Reading</strong>.</li>
          <li style={li}>Enter the Kilometres, the Reading Date, and an optional note (e.g. "Service reading").</li>
          <li style={li}>Click <strong>Save Reading</strong>.</li>
          <li style={li}>Click <strong>KM History</strong> to expand and see all past readings, including the difference between each entry.</li>
        </ol>
      </div>

      {/* DRIVERS */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>Drivers</h2>

        <h3 style={h3Style}>Adding a New Driver</h3>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>Click <strong>Drivers</strong> in the navigation bar, then click <strong>+ Add Driver</strong>.</li>
          <li style={li}>Enter First Name, Last Name, Driver Code, Phone, Licence No, Licence Type, Expiry Date, DG Licence details.</li>
          <li style={li}>Click <strong>Save Driver</strong>.</li>
        </ol>

        <h3 style={h3Style}>Assigning Depots to a Driver</h3>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>In the Drivers list, click <strong>Manage Depots</strong> on the driver's row.</li>
          <li style={li}>A popup opens showing current depot assignments. Use the dropdown to add a new depot and click <strong>Add</strong>.</li>
          <li style={li}>Click <strong>Remove</strong> next to any depot to unassign it. Click <strong>Close</strong> when done.</li>
        </ol>

        <h3 style={h3Style}>Amending Driver Licence Expiry</h3>
        <div style={note}>The previous licence details are automatically saved to history each time you amend them.</div>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>In the Drivers list, click <strong>View</strong> on the driver's row to open the Driver Detail page.</li>
          <li style={li}>In the <strong>Licence</strong> section, click <strong>Amend Licence</strong>.</li>
          <li style={li}>Enter the updated Licence No, Type, Expiry, DG Licence No, DG Expiry, and optional notes.</li>
          <li style={li}>Click <strong>Save Amendment</strong>. The old values are saved to history.</li>
          <li style={li}>Click <strong>Licence History</strong> to see all previous licence records.</li>
        </ol>

        <h3 style={h3Style}>Archiving or Restoring a Driver</h3>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>In the Drivers list, click <strong>Archive</strong> on the driver's row. Archived drivers are shown faded.</li>
          <li style={li}>To view archived drivers, change the status dropdown to <strong>Archived</strong> and click <strong>Restore</strong>.</li>
        </ol>
      </div>

      {/* MASS VERIFICATIONS */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>Mass Verifications</h2>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>Click <strong>Mass Verifications</strong> in the navigation bar.</li>
          <li style={li}>Click <strong>+ Add Verification</strong> to enter a new weighbridge record.</li>
          <li style={li}>Fill in the vehicle, date, weighbridge name and address, docket reference, driver name, and axle weights.</li>
          <li style={li}>Click <strong>Save</strong>. The record appears in the list.</li>
          <li style={li}>Use the filters at the top to search by fleet number, depot, or date range.</li>
        </ol>
      </div>

      {/* NON-CONFORMANCES */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>Non-Conformances</h2>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>Click <strong>Non-Conformances</strong> in the navigation bar.</li>
          <li style={li}>Click <strong>+ Add Record</strong>.</li>
          <li style={li}>Select a <strong>Vehicle</strong> and/or <strong>Driver</strong> (at least one is required).</li>
          <li style={li}>Choose an <strong>Incident Type</strong>: <em>30 Min Rest NC</em>, <em>Admin NC</em>, <em>Work Hours NC</em>, <em>Diary NC</em>, or <em>Distraction</em>.</li>
          <li style={li}>Enter the <strong>Incident Date</strong> and a <strong>Description</strong> (maximum 50 characters — the counter shows how many you have used).</li>
          <li style={li}>Add optional Notes for more detail, then click <strong>Save Record</strong>.</li>
          <li style={li}>Use the filter dropdowns at the top to narrow the list by type, vehicle, or driver.</li>
        </ol>
        <div style={note}>To delete a record, click the red <strong>Delete</strong> button on that row and confirm.</div>
      </div>

      {/* REPORTS */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>Reports</h2>
        <p style={{ fontSize: 14, margin: "0 0 12px" }}>
          Click <strong>Reports</strong> in the navigation bar to see all report types. Click any card to open that report.
        </p>

        <h3 style={h3Style}>Vehicle Reports</h3>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>Select any combination of filters (depot, type, make, status, dates, etc.).</li>
          <li style={li}>Click <strong>Generate Report</strong>. Results appear in the table below.</li>
          <li style={li}>Click <strong>Print / Save PDF</strong> to print or save as a PDF file.</li>
          <li style={li}>Click <strong>Download CSV</strong> to export to Excel or similar.</li>
        </ol>

        <h3 style={h3Style}>Registration Expiry</h3>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>Choose a depot, vehicle type, state, and how many days ahead to look (e.g. 90 days).</li>
          <li style={li}>Tick <strong>Include Already Expired</strong> to also see overdue registrations.</li>
          <li style={li}>Results are colour-coded: <span style={{ color: "#c5221f", fontWeight: 600 }}>red = expired or within 14 days</span>, <span style={{ color: "#e37400", fontWeight: 600 }}>orange = within 30 days</span>, <span style={{ color: "#8a6d00", fontWeight: 600 }}>yellow = within 60 days</span>.</li>
        </ol>

        <h3 style={h3Style}>Kilometre History</h3>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>Filter by depot, fleet number, or a reading date range.</li>
          <li style={li}>Click <strong>Generate Report</strong> to see all KM readings matching your filters.</li>
        </ol>

        <h3 style={h3Style}>Non-Conformance Report</h3>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>Filter by incident type, vehicle, driver, depot, or date range.</li>
          <li style={li}>After generating, a summary shows the count per incident type.</li>
        </ol>

        <h3 style={h3Style}>Mass Verifications Report</h3>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>Filter by fleet number, depot, and date range, then click <strong>Generate Report</strong>.</li>
        </ol>

        <h3 style={h3Style}>Driver Reports</h3>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={li}>Filter by depot, status (active/archived), licence type, or DG licence only.</li>
          <li style={li}>Expiry dates in red or orange indicate licences expiring soon or already expired.</li>
        </ol>
      </div>

      <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 8 }}>
        Tasco Petroleum — Carriers Fleet Management System
      </p>
    </div>
  );
}
