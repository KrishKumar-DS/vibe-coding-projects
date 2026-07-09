# Prompt Log – Animated Clock

## Project

Animated Clock Web Application

---

## Project Objective

Build a modern animated clock web application using only HTML, CSS, and JavaScript. The application should display hours, minutes, and seconds using three animated circular rings with smooth motion, modular code, and responsive design.

---

## Initial Prompts

### Prompt 1 (Plan Mode)

```text
I am building a Clock using HTML/CSS/JS.
Do not code yet, make a plan for it.

Requirements:
- Three circles representing Hours, Minutes, and Seconds.
- Each circle has a different colored perimeter.
- The perimeter moves continuously with time.
- Hour ring moves slowest.
- Minute ring moves faster.
- Second ring moves fastest.
- Smooth looping animation.
- Dark theme.
- Works offline.
- Modular code.
- Meaningful variable names.
- No duplicate code.
```

### Prompt 2 (Build Mode)

```text
Implement the above plan.
```

---

## Iterative Improvements

### Prompt 3

```text
Retest the web app that you built. Nothing is visible.
```

### Prompt 4

```text
The time is showing twice—once inside the circles and once outside.
Remove the duplicate time displayed outside the circles.
```

### Prompt 5

```text
Add responsiveness.

If the web app is opened on a smaller screen such as a phone, automatically change the layout from horizontal to vertical.
```

### Prompt 6 (Plan Mode)

```text
Whenever I open this web app on a phone, the time becomes too small to read.
Make a plan to solve this problem.
```

### Prompt 7 (Build Mode)

```text
Implement the above plan.
```

---

## AI Development Process

* Planned the application architecture.
* Designed the circular clock interface.
* Implemented modular JavaScript files.
* Created animated time rings.
* Added responsive layouts.
* Tested the application and identified UI issues.
* Fixed rendering problems.
* Removed duplicate time elements.
* Improved the mobile experience.

---

## Issues Encountered

| Issue                                  | Solution                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| Clock not visible after implementation | Reviewed the rendering logic and corrected the display issue.                   |
| Time displayed twice                   | Removed the duplicate time element outside the circles.                         |
| Mobile layout was difficult to read    | Increased the clock size and changed the layout to vertical on smaller screens. |

---

## Improvements for Future Versions

* Light & Dark theme toggle
* Multiple color palettes
* Time zone selection
* 12-hour / 24-hour format toggle
* Alarm
* Stopwatch
* Countdown timer
* Customizable ring colors
* Customizable animation speed
* Accessibility improvements
* Progressive Web App (PWA) support

---

## Prompting Lessons

* Planning before implementation produced a cleaner architecture.
* Breaking development into multiple prompts made debugging easier.
* Testing after every implementation quickly revealed UI issues.
* Separating planning and implementation resulted in more reliable AI-generated code.
* Clear requirements reduced unnecessary revisions.

---

## Project Status

✅ Version 1.0 Completed

---

## Metrics

| Metric                      | Value                                            |
| --------------------------- | ------------------------------------------------ |
| Planning Prompts            | 2                                                |
| Build Prompts               | 5                                                |
| Debug / Improvement Prompts | 5                                                |
| AI Models                   | DeepSeek V4 Flash (Free), North Mini Code (Free) |
| Technologies                | HTML5, CSS3, JavaScript (Vanilla)                |
| Project Version             | v1.0                                             |

---

## Final Project Structure

```text
Clock/
│
├── index.html
├── style.css
├── README.md
├── PROMPTS.md
│
└── js/
    ├── clock.js
    ├── palette.js
    └── ring.js
```

---

## Version History

| Version | Changes                                                                                                                                |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| v1.0    | Initial release featuring animated hour, minute, and second rings, modular JavaScript architecture, dark theme, and responsive design. |

---

## Final Reflection

This project helped me strengthen my understanding of:

* Planning before implementation
* Structuring modular JavaScript code
* Building smooth CSS-based animations
* Designing responsive user interfaces
* Debugging AI-generated code
* Iteratively improving a project through focused prompts
* Organizing a project with clear documentation and maintainable code
