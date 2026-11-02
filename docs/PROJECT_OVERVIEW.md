# DigitalNotes — Project Overview

## What DigitalNotes is

DigitalNotes is intended to make useful academic course materials easier for university students to find and access. The initial product concept is a course-centred digital library: students navigate their university and programme to find materials for a specific course, while administrators curate the academic catalogue and review submitted content.

Notes are the first type of material, not necessarily the platform's permanent limit. Over time, the same experience could support summaries, revision guides, past exam papers, exercises, and solutions. The long-term framing is therefore **a digital course-material access platform**, with course notes as its first product category.

This document describes both that product direction and the state of the current repository. The proposed proof-of-concept scope in [projects.md](projects.md) is a plan, not a claim that every planned feature is already available.

## The problem being tested

The project's central assumption is that students need a more reliable and convenient way to find course-specific study materials than informal or printed distribution provides. Materials can be difficult to discover when they are scattered across people and channels, or described without enough academic context for a student to know whether they match a course.

Students generally look for material in terms of their studies — for example, notes for a particular course, level, and semester — rather than by knowing the exact title of a file in advance. DigitalNotes makes that context the starting point for discovery.

The proof of concept should answer a business question before the platform grows in complexity:

> Can students reliably find useful materials for their courses, and will they pay for convenient, trusted access to them?

## Product vision and value

DigitalNotes aims to connect three needs:

- **Student discovery:** find relevant materials through a familiar academic structure.
- **Useful, organized content:** understand what a resource covers and which course it belongs to before deciding to access it.
- **Responsible publishing:** give the platform's operators a practical way to organize, review, and publish materials.

For students, the intended benefit is less time spent searching and more confidence that a resource is relevant to the course they are taking. For administrators, the benefit is a single place to maintain the catalogue and manage the content lifecycle. For note-takers and other contributors, the future opportunity is a clear channel for submitting useful material and potentially earning from it, subject to business and content-rights policies that are still to be decided.

## Initial audience and roles

The first version is deliberately aimed at a narrow pilot rather than a broad, multi-university marketplace. The recommended starting scope is one university, one faculty or school, a small number of departments, and a selected set of courses. A focused catalogue makes it possible to seed content, observe real student behaviour, and improve the experience without first solving the complexity of operating everywhere.

### Students

Students are the primary users of the eventual public experience. They should be able to browse the catalogue, see what materials are available for a course, assess basic resource details, and access a resource when eligible. The product is designed around academic context rather than assuming a student already knows a document's exact title.

### Administrators

Administrators maintain the academic structure and oversee the quality and availability of content. In the proof of concept, this role is especially important: a small, well-managed catalogue is more valuable than a large but unreliable one. Administrators may receive or upload material directly while the team tests demand, even if a fully self-service contributor marketplace is not yet warranted.

### Contributors and note-takers

Contributors are people who provide study materials. The intended workflow allows them to submit material for review, while administrators retain control over whether it is appropriate to publish. Contributor onboarding, compensation, ownership, and permissions need clear policies before this becomes a scaled marketplace.

## The intended student experience

The planned discovery path follows the way students understand their academic programme:

**University → faculty or school → department → level → semester → course → available materials**

A student might choose a department, select their current level and semester, open a course, and then compare the resources offered for it. A resource listing should communicate useful decision-making details such as its title, type, description, price if applicable, and whether it is available. The goal is to keep the path from “I need material for this course” to a useful resource short and understandable.

The intended commercial journey adds an account and a purchase step where required. The backend, rather than a browser-only success message, must verify a payment before granting access. The proposed design also avoids treating a permanent file-storage address as a student's entitlement: access should be checked and delivered through a controlled, time-limited mechanism. These are product and trust requirements in the plan; they are not yet a completed checkout experience in the current application.

## Content and catalogue approach

The academic catalogue gives materials a dependable home. The planned hierarchy starts with universities and faculties, continues through departments, levels, and semesters, and ends with courses. This structure supports both browsing and the operational work of assigning materials to the right course.

Each resource should be understandable as a piece of course content, not just a file. The initial note categories described in the plan are lecture notes, summaries, revision materials, past exams, and exercises. The first pilot should keep the number of categories manageable and concentrate on content that students actually request.

A review lifecycle is also part of the product concept. Materials may be drafts or awaiting review before publication, then be published, rejected, or archived. Review helps maintain relevance and gives administrators a way to correct or remove outdated content. The platform should make the status of a resource operationally clear without making students navigate internal moderation details.

## Business model under consideration

The proof-of-concept plan explores selling access to individual resources. A student selects a course resource, initiates a payment through a suitable provider, and receives access after the transaction has been verified. The design is intended to keep the payment provider replaceable, since provider availability and local payment preferences may shape the pilot.

Pricing, currency, payment provider, platform commission, contributor share, refunds, and the exact access policy have not been established as final business decisions. The example prices and currencies in planning material are illustrative, not a confirmed price list. These questions should be resolved with the pilot's location, students, contributors, and payment options in mind.

The business model should be evaluated using actual behaviour and costs. Registrations alone are not proof of demand: purchases, repeat purchases, payment fees, content supply, and the economics of serving each transaction matter as well.

## How the proof of concept should be measured

The POC is an experiment in product demand, not simply a technical delivery milestone. Useful questions and measures include:

- **Acquisition:** how many students discover the service, and how many create an account?
- **Content demand:** which courses are browsed or searched, which resources are viewed, and where students encounter an empty catalogue?
- **Conversion:** how often does viewing a resource lead to a completed purchase?
- **Economics:** how do price, sales, payment fees, platform income, and any contributor payments relate to one another?
- **Retention:** do students return to obtain materials for another course after their first use?

A repeat purchase is particularly valuable evidence: it suggests the platform solves an ongoing study need rather than attracting one-time curiosity. The pilot should also pay attention to courses with demand but no content, since those gaps can guide content acquisition.

## What is intentionally outside the first release

The recommended POC does not need to begin with native mobile applications, AI-generated or AI-summarized notes, recommendation systems, social feeds, messaging, ratings, subscriptions, university-system integrations, extensive analytics, referral programmes, or multi-country operations. These ideas may become useful later, but they do not answer the first question: whether students can find relevant material and will use or pay for it.

Similarly, the first release does not need a complex contributor marketplace. A controlled, partly manual content process is acceptable while the team learns what students need and how content should be reviewed.

## Current state of the project

The repository contains the foundations of the planned product, but it does not yet deliver the complete student-facing course-material marketplace described above. It currently has three separate frontend applications and an AdonisJS backend.

- **Admin application:** provides screens for academic organisation, courses, employees, and course-associated notes. The course note-management experience supports reviewing note status and actions such as publishing, rejecting, and archiving. The dashboard screen is still a placeholder, and parts of the employee-management experience are not yet a finished operational workflow.
- **Contributor application:** includes login and screens for viewing and submitting notes, with status filtering. Its current note list is held in in-memory frontend state, so the submission experience should be treated as an interface prototype rather than a persisted end-to-end contributor service.
- **Student application:** currently presents a simple personal-notebook experience for creating and listing notes in local page state. It is not yet the planned public catalogue for browsing university courses and buying course materials.
- **Backend:** provides account/authentication capabilities, academic catalogue operations, note creation and status management, and file-upload plumbing. The backend and data model include course-linked notes and uploaded pages, providing a foundation for content operations.

In particular, the current backend routes do not expose a purchase or payment workflow, purchase history, or a student download entitlement flow. The intended payment verification and controlled-access experience remains future work. The difference between the current repository and the POC plan should be kept visible when planning milestones or describing the product to pilot users.

## Delivery direction

The implementation order proposed in [projects.md](projects.md) is designed to reduce risk by validating the product in stages:

1. **Make the catalogue useful:** define the pilot's academic structure and let students find their courses.
2. **Establish content operations:** support uploading, organizing, reviewing, and publishing course materials.
3. **Introduce accounts:** identify users and understand how they use the service.
4. **Test transactions and access:** connect a payment provider, verify transactions, and grant access only after successful verification.
5. **Measure behaviour and economics:** track demand, conversion, repeat use, and costs well enough to decide what to build next.

Each stage should produce a usable outcome and answer a question. The team should avoid building speculative features ahead of evidence from students and content providers.

## Decisions to make before a live pilot

Several product and operating decisions remain open and should be agreed before the platform handles real users or paid content:

- Which university, faculty, departments, and courses are in the pilot?
- Who supplies the initial materials, and who confirms that they may be distributed?
- What quality, relevance, and freshness standards determine whether material is approved?
- Which payment method and currency suit the pilot audience?
- What price, platform share, contributor compensation, refund policy, and access duration apply?
- Which actions require an administrator, and what can contributors do themselves?
- What information will be collected to measure product demand, and how will user privacy be protected?

Resolving these questions is part of defining a trustworthy service, not a detour from product development.

## Summary

DigitalNotes is being shaped as a practical, course-first way for students to find and access useful study materials. Its first proof of concept should focus on a small academic catalogue, reliable content review, a simple student discovery experience, and evidence that students return and are willing to pay. The repository already contains meaningful foundations for catalogue and note administration, but the learner marketplace, payments, and paid access still need to be built and validated.
