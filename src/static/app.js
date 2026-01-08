/**
 * @fileOverview 该文件包含活动管理应用的主要逻辑，包括从API获取活动列表和处理用户注册。
 * 
 * @module app
 * 
 * @requires fetch
 * 
 * @function fetchActivities
 * @description 从API获取活动列表，并将其显示在页面上。每个活动的详细信息包括名称、描述、时间表和可用名额。
 * 
 * @async
 * @throws {Error} 如果获取活动失败，将在控制台输出错误信息，并在页面上显示错误消息。
 * 
 * @function signupForm.addEventListener
 * @description 处理用户提交的注册表单。将用户的电子邮件和所选活动发送到API进行注册。
 * 
 * @async
 * @param {Event} event - 表单提交事件。
 * @throws {Error} 如果注册失败，将在控制台输出错误信息，并在页面上显示错误消息。
 * 
 * @global
 * @const {HTMLElement} activitiesList - 显示活动列表的 HTML 元素。
 * @const {HTMLElement} activitySelect - 用户选择活动的下拉菜单。
 * @const {HTMLElement} signupForm - 用户注册的表单元素。
 * @const {HTMLElement} messageDiv - 用于显示消息的 HTML 元素。
 */
document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

       // Reset dropdown options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <h5>Participants:</h5>
          <ul class="participants-list">
            ${details.participants
              .map(email => {
                const username = email.split("@")[0];
                return `
                  <li class="participant-item" data-activity="${name}" data-email="${email}">
                    <span>${username}</span>
                    <button class="remove-participant" aria-label="Remove ${username}" title="Remove">
                      &times;
                    </button>
                  </li>`;
              })
              .join("")}
          </ul>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle participant removal via delegated click
  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".remove-participant");
    if (!removeButton) return;

    const participantItem = removeButton.closest(".participant-item");
    const activity = participantItem?.dataset.activity;
    const email = participantItem?.dataset.email;

    if (!activity || !email) return;

    removeButton.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message || "Participant removed";
        messageDiv.className = "success";
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Failed to remove participant";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
      console.error("Error removing participant:", error);
    } finally {
      removeButton.disabled = false;
    }
  });

  // Initialize app
  fetchActivities();
});
