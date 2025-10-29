
📊 Database Smoke Test

════════════════════════════════════════════════════════════
✅ organization                        1
✅ user                                1
✅ organizationMembership              1
⚪ organizationRole                    0
⚪ organizationPermission              0
⚪ rolePermission                      0
✅ brand                               1
⚪ brandVoice                          0
⚪ brandAsset                          0
⚪ embeddingSpace                      0
✅ agent                               3
✅ agentCapability                     6
✅ agentConfig                         4
⚪ agentRun                            0
⚪ agentRunMetric                      0
⚪ agentJob                            0
✅ tool                                3
⚪ toolExecution                       0
⚪ conversation                        0
⚪ message                             0
⚪ dataset                             0
⚪ document                            0
⚪ chunk                               0
⚪ campaign                            0
⚪ campaignMetric                      0
⚪ marketingCampaign                   0
⚪ marketingLead                       0
⚪ marketingTouchpoint                 0
⚪ marketingMetric                     0
⚪ content                             0
⚪ contentDraft                        0
⚪ emailSequence                       0
⚪ socialPost                          0
⚪ aBTest                              0
✅ connector                          16
✅ connectorAuth                       3
⚪ triggerConfig                       0
⚪ actionConfig                        0
⚪ credential                          0
⚪ auditLog                            0
⚪ apiKey                              0
⚪ person                              0
⚪ identity                            0
⚪ consent                             0
⚪ event                               0
⚪ note                                0
⚪ memEmbedding                        0
⚪ topic                               0
⚪ objective                           0
⚪ task                                0
⚪ feedback                            0
⚪ budgetProfile                       0
⚪ budgetAllocation                    0
⚪ budgetTransaction                   0
⚪ budgetLedger                        0
⚪ payment                             0
⚪ payout                              0
⚪ snippetLibrary                      0
✅ persona                             3
✅ keyword                             6
✅ editorialCalendar                   4
⚪ modelVersion                        0
⚪ trainingJob                         0
⚪ inferenceEndpoint                   0
⚪ metricEvent                         0
⚪ userSettings                        0
⚪ subscription                        0
⚪ invoice                             0
⚪ usageRecord                         0
⚪ account                             0
⚪ session                             0
⚪ verificationToken                   0
⚪ teamMember                          0
════════════════════════════════════════════════════════════

📈 Summary:
   Models checked:     73
   Successful queries: 73
   Failed queries:     0
   Total rows:         52

🔌 Omni-Channel Infrastructure:
   Connectors:         16 (expected: 15+)
   Connector Auths:    3
   Agents:             3
   Tools:              3

🧠 Vector-Enabled Tables:
   BrandVoice:         0 (with embeddings)
   Messages:           0 (with embeddings)
   Chunks:             0 (with embeddings)
   AgentMemory:        0 (with embeddings)


