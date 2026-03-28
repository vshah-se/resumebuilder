import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { createServerClient } from '@/lib/insforge';

interface ExperienceEntry {
  company: string;
  role: string;
  location: string;
  bullets: string[];
}

interface EducationEntry {
  school: string;
  degree: string;
  location: string;
}

interface ResumeContent {
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { resumeId } = await req.json();

    if (!resumeId) {
      return NextResponse.json({ error: 'resumeId is required' }, { status: 400 });
    }

    const insforge = createServerClient();

    const { data: resumeData, error: resumeError } = await insforge.database
      .from('generated_resumes')
      .select('*')
      .eq('id', resumeId)
      .limit(1);

    if (resumeError || !resumeData?.length) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const { data: profileData } = await insforge.database
      .from('profiles')
      .select('*')
      .limit(1);

    const resume = resumeData[0];
    const profile = profileData?.[0];
    const content: ResumeContent = resume.content;

    const navy = '1a2332';
    const gray = '64748b';
    const darkGray = '334155';
    const sections: Paragraph[] = [];

    // Header - Name
    if (profile) {
      sections.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: `${profile.first_name} ${profile.last_name}`,
              bold: true,
              size: 44,
              color: navy,
              font: 'Calibri',
            }),
          ],
        })
      );

      const contactParts = [profile.email, profile.phone,
        [profile.city, profile.state].filter(Boolean).join(', ')
      ].filter(Boolean);

      if (contactParts.length > 0) {
        sections.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: contactParts.join('  |  '),
                size: 18,
                color: gray,
                font: 'Calibri',
              }),
            ],
          })
        );
      }

      const links = [profile.linkedin, profile.portfolio_link].filter(Boolean);
      if (links.length > 0) {
        sections.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: links.join('  |  '),
                size: 18,
                color: gray,
                font: 'Calibri',
              }),
            ],
          })
        );
      }
    }

    // Separator line
    sections.push(
      new Paragraph({
        spacing: { after: 200 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'e2e8f0' },
        },
      })
    );

    // Summary
    if (content.summary) {
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 100, after: 80 },
          children: [
            new TextRun({ text: 'PROFESSIONAL SUMMARY', bold: true, size: 22, color: navy, font: 'Calibri' }),
          ],
        }),
        new Paragraph({
          spacing: { after: 160 },
          children: [
            new TextRun({ text: content.summary, size: 20, color: darkGray, font: 'Calibri' }),
          ],
        })
      );
    }

    // Experience
    if (content.experience?.length > 0) {
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 100, after: 80 },
          children: [
            new TextRun({ text: 'EXPERIENCE', bold: true, size: 22, color: navy, font: 'Calibri' }),
          ],
        })
      );

      for (const exp of content.experience) {
        const companyRuns: TextRun[] = [
          new TextRun({ text: exp.company, bold: true, size: 20, color: '1e293b', font: 'Calibri' }),
        ];
        if (exp.location) {
          companyRuns.push(
            new TextRun({ text: `  |  ${exp.location}`, size: 20, color: gray, font: 'Calibri' })
          );
        }
        sections.push(new Paragraph({ spacing: { before: 80 }, children: companyRuns }));

        if (exp.role) {
          sections.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: exp.role, italics: true, size: 20, color: '475569', font: 'Calibri' }),
              ],
            })
          );
        }

        if (exp.bullets?.length) {
          for (const bullet of exp.bullets) {
            sections.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 20 },
                children: [
                  new TextRun({ text: bullet, size: 19, color: darkGray, font: 'Calibri' }),
                ],
              })
            );
          }
        }
      }
    }

    // Education
    if (content.education?.length > 0) {
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 160, after: 80 },
          children: [
            new TextRun({ text: 'EDUCATION', bold: true, size: 22, color: navy, font: 'Calibri' }),
          ],
        })
      );

      for (const edu of content.education) {
        const eduRuns: TextRun[] = [
          new TextRun({ text: edu.school, bold: true, size: 20, color: '1e293b', font: 'Calibri' }),
        ];
        if (edu.location) {
          eduRuns.push(
            new TextRun({ text: `  |  ${edu.location}`, size: 20, color: gray, font: 'Calibri' })
          );
        }
        sections.push(new Paragraph({ children: eduRuns }));

        if (edu.degree) {
          sections.push(
            new Paragraph({
              spacing: { after: 60 },
              children: [
                new TextRun({ text: edu.degree, size: 20, color: '475569', font: 'Calibri' }),
              ],
            })
          );
        }
      }
    }

    // Skills
    if (content.skills?.length > 0) {
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 160, after: 80 },
          children: [
            new TextRun({ text: 'SKILLS', bold: true, size: 22, color: navy, font: 'Calibri' }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: content.skills.join('  \u2022  '), size: 19, color: darkGray, font: 'Calibri' }),
          ],
        })
      );
    }

    const document = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 720, bottom: 720, left: 720, right: 720 },
            },
          },
          children: sections,
        },
      ],
    });

    const docxBuffer = await Packer.toBuffer(document);

    return new NextResponse(new Uint8Array(docxBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="resume.docx"`,
      },
    });
  } catch (err) {
    console.error('DOCX generation error:', err);
    return NextResponse.json({ error: 'Failed to generate DOCX' }, { status: 500 });
  }
}
