window.addEventListener("message", (event) => {
  console.log(`Message received`, event.data);
  if (event.origin !== "http://localhost:5173") {
    console.warn("Message from unauthorized origin", event.origin);
    return;
  }

  try {
    const data =
      typeof event.data === "string" ? JSON.parse(event.data) : event.data;
    console.log("Received message:", data);
    switch (data.type) {
      case "handleSubmit":
        // Parent is requesting form submission
        handleFormSubmit(data.id);
        break;
      case "clearForm":
        // Parent wants to clear the form
        form.reset();
        sendMessageToParent({
          type: "formCleared",
          id: data.id,
          payload: { success: true },
        });
        break;
      case "prefillForm":
        // Parent wants to prefill form data
        prefillForm(data.payload);
        break;
      default:
        console.warn("Unknown message type:", data.type);
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
  }
});

function handleFormSubmit(requestId) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Validate form
  if (!form.checkValidity()) {
    sendMessageToParent({
      type: "formValidationError",
      id: requestId,
      payload: {
        error: "Form validation failed",
        fields: getValidationErrors(),
      },
    });
    return;
  }

  // Send form data to parent
  sendMessageToParent({
    type: "formSubmitted",
    id: requestId,
    payload: {
      formData: data,
      timestamp: new Date().toISOString(),
    },
  });
}

function prefillForm(data) {
  if (data.name) form.name.value = data.name;
  if (data.email) form.email.value = data.email;
}

function getValidationErrors() {
  const errors = [];
  const inputs = form.querySelectorAll("input[required]");
  inputs.forEach((input) => {
    if (!input.checkValidity()) {
      errors.push({
        field: input.name,
        message: input.validationMessage,
      });
    }
  });
  return errors;
}

function sendMessageToParent(messageData) {
  window.parent.postMessage(JSON.stringify(messageData), "*");
}

// Handle normal form submission
form.addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  sendMessageToParent({
    type: "formSubmitted",
    payload: {
      formData: data,
      timestamp: new Date().toISOString(),
      submittedBy: "user",
    },
  });
});
