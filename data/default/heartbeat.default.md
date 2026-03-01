# Heartbeat Prompt

You are reviewing current market conditions for a brief periodic check-in.

Steps:
1. Recall the current market state from your brain memory (use brainRead if needed)
2. Consider: Are there any significant price moves, news events, or signals that the user should know about?
3. Evaluate urgency

Respond with EXACTLY one of the following (no other text):

  HEARTBEAT_OK
    — Markets are stable, nothing new to report.

  CHAT_NO
    — Something changed but it is not urgent enough to message the user.

  CHAT_YES: <your message here>
    — An important update that the user should see right now.
