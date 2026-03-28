import { NextRequest, NextResponse } from 'next/server';
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

    // Fetch resume with profile data
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

    // Generate ATS-friendly PDF using native text objects (not canvas/DOM)
    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 55, right: 55 },
      info: {
        Title: `${profile?.first_name || ''} ${profile?.last_name || ''} Resume`,
        Author: `${profile?.first_name || ''} ${profile?.last_name || ''}`,
      },
    });

    const chunks: Uint8Array[] = [];
    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));

    const pdfReady = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    const navy = '#1a2332';
    const lineWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Header - Name
    if (profile) {
      doc.fontSize(22).font('Helvetica-Bold').fillColor(navy)
        .text(`${profile.first_name} ${profile.last_name}`, { align: 'center' });

      // Contact line
      const contact = [profile.email, profile.phone,
        [profile.city, profile.state].filter(Boolean).join(', ')
      ].filter(Boolean).join('  |  ');
      if (contact) {
        doc.fontSize(9).font('Helvetica').fillColor('#64748b')
          .text(contact, { align: 'center' });
      }

      const links = [profile.linkedin, profile.portfolio_link].filter(Boolean).join('  |  ');
      if (links) {
        doc.fontSize(9).font('Helvetica').fillColor('#64748b')
          .text(links, { align: 'center' });
      }
    }

    doc.moveDown(0.5);
    doc.moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.margins.left + lineWidth, doc.y)
      .strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(0.5);

    // Summary
    if (content.summary) {
      doc.fontSize(11).font('Helvetica-Bold').fillColor(navy)
        .text('PROFESSIONAL SUMMARY');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#334155')
        .text(content.summary);
      doc.moveDown(0.5);
    }

    // Experience
    if (content.experience?.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold').fillColor(navy)
        .text('EXPERIENCE');
      doc.moveDown(0.3);

      for (const exp of content.experience) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b')
          .text(exp.company, { continued: exp.location ? true : false });
        if (exp.location) {
          doc.font('Helvetica').fillColor('#64748b')
            .text(`  |  ${exp.location}`);
        }
        if (exp.role) {
          doc.fontSize(10).font('Helvetica-Oblique').fillColor('#475569')
            .text(exp.role);
        }
        if (exp.bullets?.length) {
          doc.moveDown(0.15);
          for (const bullet of exp.bullets) {
            doc.fontSize(9.5).font('Helvetica').fillColor('#334155')
              .text(`\u2022  ${bullet}`, {
                indent: 10,
                lineGap: 1,
              });
          }
        }
        doc.moveDown(0.4);
      }
    }

    // Education
    if (content.education?.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold').fillColor(navy)
        .text('EDUCATION');
      doc.moveDown(0.3);

      for (const edu of content.education) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b')
          .text(edu.school, { continued: edu.location ? true : false });
        if (edu.location) {
          doc.font('Helvetica').fillColor('#64748b')
            .text(`  |  ${edu.location}`);
        }
        if (edu.degree) {
          doc.fontSize(10).font('Helvetica').fillColor('#475569')
            .text(edu.degree);
        }
        doc.moveDown(0.3);
      }
    }

    // Skills
    if (content.skills?.length > 0) {
      doc.moveDown(0.2);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(navy)
        .text('SKILLS');
      doc.moveDown(0.3);
      doc.fontSize(9.5).font('Helvetica').fillColor('#334155')
        .text(content.skills.join('  \u2022  '));
    }

    doc.end();

    const pdfBuffer = await pdfReady;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume.pdf"`,
      },
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
